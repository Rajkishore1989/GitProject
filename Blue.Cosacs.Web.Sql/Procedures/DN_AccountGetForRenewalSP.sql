SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS OFF 
GO

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[DN_AccountGetForRenewalSP]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
drop procedure [dbo].[DN_AccountGetForRenewalSP]
GO

CREATE PROCEDURE 	dbo.DN_AccountGetForRenewalSP
			@acctno varchar(12),
			@iscurrentsettled bit,
			@ismenucall bit,
			@custid varchar(20) OUTPUT,
			@return int=0 OUTPUT

AS
	SET NOCOUNT ON
	
	-- procedure is used from two places letter generation and from normal.net. if from letter generation 
	-- then acctno and custid will be passed in blank.
	
	
	----------------------------------------------------
	--
	--RM 14/07/2011 - Re-written for RI integration
	--
	----------------------------------------------------
	
	
	SET 	@return = 0			--initialise return code

	DECLARE	@days int,
			@expirydays int, 
			@promptdays int,
			@value varchar(12)

	--drop table #accounts
	CREATE TABLE #accounts
	(
		acctno varchar(12),
		itemid int,
		itemiupc varchar(20),
		stocklocn smallint,
		[description] varchar(35),
		warrantyid int,
		warrantyiupc varchar(20),
		warrantylocn smallint,		
		contractno varchar(10),
		itemrefcode varchar(3),
		expires datetime,
		newwarrantyid int,
		newwarrantyiupc varchar(20),
		newwarrantydesc varchar(35),
		newwarrantyprice float,	
		newcontractno varchar(10)
	)


	CREATE TABLE #tmpaccs
	(
		acctno varchar(12),
	)	

	IF @custid= '' AND @acctno =''
	BEGIN -- check if want letters
		SELECT	@value = value FROM countrymaintenance 		
		WHERE	name = 'Warranty Expiry letter generation in months'
  		IF ISNUMERIC(@value) = 0 
			return
	END
	ELSE    
	BEGIN
		SELECT	@value = value 
		FROM	countrymaintenance 		
		WHERE	codename = 'warrantyexpirypromptdays'
  		IF ISNUMERIC(@value) = 0 
			return
	END
	IF @custid = '' AND @acctno = ''  -- this is from end of day
	BEGIN
		SELECT	@days = convert(integer,value) * 30
		FROM	countrymaintenance
		WHERE	name = 'Warranty Expiry letter generation in months'
		SET @return =@@error
	END
	ELSE
	BEGIN
		SELECT	@days = convert(integer,value)
		FROM	countrymaintenance
		WHERE	codename = 'warrantyexpirypromptdays'
		SET @return =@@error
	END
	
	SELECT	@expirydays = convert(integer,value)
	FROM	countrymaintenance
	WHERE	codename = 'warrantyexpirymaxprompt'

	SELECT	@promptdays = convert(integer,value)
	FROM	countrymaintenance
	WHERE	codename = 'activepromptdays'

	SELECT	@custid = ISNULL(custid, '')
	FROM	custacct
	WHERE	acctno = @acctno
	AND		hldorjnt = 'H'

	INSERT INTO #tmpaccs
	SELECT	@acctno

	IF @ACCTNO !='' OR @CUSTID !='' and @return = 0 
	BEGIN	
		INSERT INTO #tmpaccs
   		SELECT	a.acctno
		FROM	acct a, custacct c, accttype t
   		WHERE	c.custid = @custid
   		AND	a.acctno = c.acctno
   		AND	a.accttype = t.genaccttype
   		AND	t.accttype !=('S')
		AND   c.hldorjnt ='H'
		AND a.acctno != @acctno			
      SET @return =@@error
	END	
	ELSE
	BEGIN -- BLANK acctno and custid - doing this from eod
		IF @return = 0
		BEGIN 
			INSERT INTO #tmpaccs
   			SELECT	a.acctno
			FROM	acct a, custacct c, accttype t
   			WHERE	a.acctno = c.acctno
   			AND	a.accttype = t.genaccttype
   			AND	t.accttype !=('S')
			AND   c.hldorjnt ='H'
			AND EXISTS (SELECT 1 FROM lineitem l
						--INNER JOIN warrantyBand warr on l.itemid = warr.itemId 
						--			AND warr.warrantylength = 36
						inner join Warranty.Warranty w on l.itemno=w.Number 		-- #16430
						inner join Warranty.Renewal r on w.id=r.WarrantyId			-- #16430
						INNER JOIN stockitem item ON l.ParentItemID = item.itemid 
									AND	l.parentlocation = item.stocklocn
									--AND	item.warrantyrenewalflag = 'Y'
						WHERE l.acctno = a.acctno 
					)
			SET @return =@@error
		END	
	END

	CREATE CLUSTERED index ix_accountshash3434 on #accounts(acctno)
   
	IF @return = 0 
	BEGIN
   		INSERT INTO #accounts
   		(
		acctno, itemid, itemiupc,stocklocn, [description],warrantyid, warrantyiupc,
		warrantylocn, contractno, itemrefcode , expires , newwarrantyid , 
		newwarrantyiupc,newwarrantydesc , newwarrantyprice , newcontractno
		)
   		SELECT	l.acctno, l.itemid, s.IUPC, l.stocklocn, s.itemdescr1, 0,'',
   		0,'', s.refcode, '1/1/1900', 0,
   		'', '', 0, ''    
		
		FROM #tmpaccs t, lineitem l, stockitem s, lineitem lw		-- #16430
   		WHERE t.acctno = l.acctno
   		AND	l.itemid = s.itemid
   		AND	l.stocklocn = s.stocklocn
   		AND	s.itemtype != 'N' -- using s.itemtype as l.itemtype wasn't always populated
   		AND	l.quantity > 0
		and l.acctno=lw.acctno				-- #16430
		and l.itemid=lw.parentitemid
		AND	l.stocklocn=lw.stocklocn
		and lw.contractno!=''
		AND	lw.quantity > 0
		and exists (select * from Warranty.Warranty w inner join Warranty.Renewal r on w.id=r.WarrantyId
					where lw.itemno=w.Number)
		--AND   s.warrantyrenewalflag ='Y'
   		SET @return =@@error
	END

	
	
	IF @ACCTNO ='' and @CUSTID ='' and @return = 0 -- doing from letter generation - so removing accounts already with letters
	BEGIN	
		DELETE FROM #accounts 
		WHERE EXISTS(SELECT	* 
					 FROM	letter l 
					 WHERE	l.acctno = #accounts.acctno 
					 AND	l.lettercode ='WR')	
		SET @return =@@error
	END

	---- PRINT 'stage 2'         
	--IF @return = 0
	--BEGIN
	--	UPDATE	#accounts
	--	SET		renewalrefcode = c.code
 --  		FROM	code c
 --  		WHERE	#accounts.itemrefcode = LEFT(c.codedescript, 2)
 --  		AND		c.category = 'WRC'

	--	SET @return =@@error
	--END	 

	IF @return = 0
	BEGIN
		UPDATE	#accounts
		SET	warrantyid = 
	   					ISNULL((SELECT max(l.itemid)
								FROM   lineitem l, stockitem s
								WHERE  l.acctno = #accounts.acctno
								AND	l.parentitemid = #accounts.itemid
								AND l.parentlocation = #accounts.stocklocn
								AND	l.ItemID = s.ItemID
								AND	l.stocklocn = s.stocklocn
								AND	s.category in (select distinct code from code where category = 'WAR')	
								AND	l.quantity > 0) ,'')
		 SET @return =@@error
	END	 

	-- PRINT 'stage 2.5'
	IF @return = 0 
	BEGIN
   		UPDATE	#accounts
   		SET		warrantyIUPC = 
   		
   				ISNULL((
   					select s.IUPC
   					from StockInfo s
   					where s.Id = #accounts.warrantyid

   					),'')

   		SET @return =@@error
	END

	-- PRINT 'stage 3'
	IF @return = 0
	BEGIN
		UPDATE	#accounts
		SET		warrantylocn = 
	   						ISNULL((SELECT max(l.stocklocn)
							FROM   lineitem l, stockitem s
								WHERE  l.acctno = #accounts.acctno
								AND	l.parentitemid = #accounts.itemid
								AND l.parentlocation = #accounts.stocklocn
								AND	l.ItemID = s.ItemID
								AND	l.stocklocn = s.stocklocn
								AND	s.category in (select distinct code from code where category = 'WAR')	
								AND	l.quantity > 0) ,'')
		 SET @return =@@error 
	END
	
	--  PRINT 'stage 4'
	IF @return = 0
	BEGIN
		UPDATE	#accounts
		SET		contractno = l.contractno
   		FROM	lineitem l
   		WHERE	#accounts.acctno = l.acctno
   		AND	    #accounts.warrantyid = l.ItemID
   		AND	    #accounts.warrantylocn = l.stocklocn
		AND	    l.ParentItemID = #accounts.itemId
		AND     l.parentlocation = #accounts.stocklocn
   		SET @return =@@error
   END
   	
	-- PRINT 'stage 5'
	IF @return = 0 
	BEGIN
   		UPDATE	#accounts
   		SET		newwarrantyid = 
   		
   				ISNULL((
   					select top 1 s.ID
					from  warranty.warranty w inner join Warranty.Renewal r on w.id=r.WarrantyId		-- #16430
						inner join warranty.warranty wr on wr.id=r.RenewalId
						inner join StockInfo s on wr.Number=s.iupc
   						inner join StockPrice p on s.ID = p.ID
   					where p.branchno = #accounts.warrantylocn
   						and s.category in (select code from code where category = 'WAR')

   			--		from StockInfo s
   			--			inner join StockPrice r on s.ID = r.ID
   			--		where r.refcode = #accounts.itemrefcode
   			--			and r.branchno = #accounts.warrantylocn
   			--			and s.warrantyrenewalflag = 'Y'
   			--			and s.category in (select code from code where category = 'WAR')
						--and repossesseditem = 0

   					),'')

   		SET @return =@@error
	END
	
	-- PRINT 'stage 5.5'
	IF @return = 0 
	BEGIN
   		UPDATE	#accounts
   		SET		newwarrantyIUPC = 
   		
   				ISNULL((
   					select s.IUPC
   					from StockInfo s
   					where s.Id = #accounts.newwarrantyid
   					),'')

   		SET @return =@@error
	END
	
	-- PRINT 'stage 6'
	IF @return = 0
	BEGIN
		UPDATE	#accounts
		SET		newwarrantydesc = w.description,		-- #16430
   				newwarrantyprice = s.unitpricehp
		FROM	stockitem s,Warranty.Warranty w			-- #16430
		WHERE	#accounts.newwarrantyid = s.ItemID
		AND		#accounts.warrantylocn = s.stocklocn
		and		w.Number=s.iupc							-- #16430
		SET @return =@@error
	END
	
	-- PRINT 'stage 7'
	IF @return = 0
	BEGIN
		UPDATE	#accounts
			--SET		expires = DATEADD(month, w.Length, d.datedel)		-- #16430
		SET		expires = DATEADD(month, ws.WarrantyLength, ws.EffectiveDate)		--#18361	-- #16430
		FROM	delivery d, Warranty.Warranty w, Warranty.WarrantySale ws	--#18361			-- #16430
		WHERE	#accounts.acctno = d.acctno
		AND		#accounts.warrantyId = d.itemid
		AND		#accounts.warrantylocn = d.stocklocn
		AND		#accounts.contractno = d.contractno
		AND		#accounts.acctno = ws.CustomerAccount			--#18361
		AND		#accounts.contractno = ws.WarrantyContractNo	--#18361
		and w.Number=#accounts.warrantyiupc					-- #16430

		--SET		expires = DATEADD(year, 3, d.datetrans)
		--FROM	delivery d
		--WHERE	#accounts.acctno = d.acctno
		--AND		#accounts.warrantyId = d.itemid
		--AND		#accounts.warrantylocn = d.stocklocn
		--AND		#accounts.contractno = d.contractno
		SET @return =@@error
	end 
	
	---- PRINT 'stage 8'
	IF @return = 0
	BEGIN
		--DELETE FROM #accounts
		--WHERE NOT EXISTS(SELECT 1
		--		FROM 	warrantyband w
		--		WHERE	#accounts.warrantyid = w.ItemID
		--		AND 	w.warrantylength = 36)
		delete #accounts									-- #16430
		where not exists(select 1 from warranty.Renewal r inner join warranty.Warranty w on r.WarrantyId=w.Id
				left join warranty.warranty w1 on r.RenewalId = w1.Id
				where newwarrantyiupc=w1.Number)

		SET @return =@@error
	END
	
	-- PRINT 'stage 9'
	IF(@ismenucall = 0 and @return = 0)
	BEGIN
		DELETE FROM #accounts
		WHERE EXISTS(SELECT 	1
			     FROM	acctcode a
			     WHERE	#accounts.acctno = a.acctno
			     AND    a.reference = #accounts.contractno
			     AND 	a.code = N'WR3' and a.datedeleted is null) 
	    SET @return =@@error
	END

	IF @return = 0
	BEGIN
		DELETE FROM #accounts
			WHERE EXISTS(SELECT 	1
					FROM	delivery d
					WHERE	#accounts.acctno = d.acctno 
					AND		d.contractno = #accounts.contractno 
					AND		d.itemid =#accounts.warrantyid 
					AND		d.delorcoll IN ('C','R')) 
		SET @return =@@error
	END
		
		
	--   print 'stage 10'
	IF @return = 0
	BEGIN
		DELETE FROM #accounts
		WHERE EXISTS(SELECT 	1
				FROM 	acctcode a, warrantyrenewalpurchase w
				WHERE	#accounts.acctno = a.acctno
				AND		#accounts.acctno = w.stockitemacctno
				AND		#accounts.contractno = w.originalcontractno
				AND		#accounts.warrantylocn = w.originalstocklocn
				AND 	a.code = N'WRP' and a.datedeleted is null)
		SET @return =@@error		
	END
	 
	--   print 'stage 11'
	IF @ACCTNO = '' AND @CUSTID = '' and @return = 0-- FROM END OF DAY
	BEGIN --remove where either expires prior to letter generation date or after expiry days
		DELETE FROM #accounts 
		WHERE DATEADD(DAY, -@days, EXPIRES) > GETDATE() -- if it is not within the 'no' of months prior to expiry date.
		OR DATEADD(DAY, @expirydays, EXPIRES) < GETDATE()  -- if it is not within the 'no' of months prior to expiry + 'no' of days on top of original expiry.
      SET @return =@@error
	END
	ELSE 
	IF @return = 0
	BEGIN         
		IF(@iscurrentsettled = 1)
		BEGIN		                     
    		DELETE FROM #accounts
			WHERE (DATEADD(DAY, -@promptdays, EXPIRES) > GETDATE()
			OR DATEADD(DAY, @expirydays, EXPIRES) < GETDATE())
			AND acctno != @acctno  
			SET @return =@@error
	
   			DELETE FROM #accounts
			WHERE (DATEADD(DAY, -@days, EXPIRES) > GETDATE()
			OR DATEADD(DAY, @expirydays, EXPIRES) < GETDATE())
			AND acctno = @acctno  
			SET @return =@@error
		END
		ELSE	
		BEGIN
			DELETE FROM #accounts
			WHERE DATEADD(DAY, -@promptdays, EXPIRES) > GETDATE()
			OR DATEADD(DAY, @expirydays, EXPIRES) < GETDATE()
		END	
	END
	

	--   print 'stage 12'
	DELETE 	FROM #accounts
	WHERE	newwarrantyid = 0
	
	IF @ACCTNO !='' OR @CUSTID !='' 
	BEGIN	
   		SELECT	acctno,
				itemid,
				itemiupc as itemno,									--IP - 16/06/11 - CR1212 - RI - #3941
				stocklocn,
				description,
				warrantyid,
				warrantyiupc as warrantyno,							--IP - 16/06/11 - CR1212 - RI - #3941
				warrantylocn,
				contractno,
				convert(smalldatetime, convert(varchar(10), expires, 105), 105) as expires,
				newwarrantyid,
				newwarrantyIUPC as renewalwarrantyno,
				newwarrantydesc as warrantydesc1,
				newwarrantyprice as warrantyprice
		FROM	#accounts
	END
   
	IF @ACCTNO ='' AND @CUSTID ='' and @return = 0-- from letter generation process so inserting into letter
	BEGIN	
		INSERT INTO LETTER 
		(	acctno, 
			dateacctlttr, 
			datedue, 
			lettercode, 
			addtovalue
		)
		SELECT	acctno,
				GETDATE(),
				DATEADD(day, 7, GETDATE()),
				'WR',
				0 from #accounts
        GROUP BY ACCTNO
        SET @return =@@error      
   END 

	IF (@return = 0)
	BEGIN
		SET @return = @return
	END
GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

