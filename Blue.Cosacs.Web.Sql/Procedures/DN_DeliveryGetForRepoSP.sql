
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS OFF 
GO

if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_DeliveryGetForRepoSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
drop procedure [dbo].[DN_DeliveryGetForRepoSP]
GO

CREATE PROCEDURE dbo.DN_DeliveryGetForRepoSP
-- **********************************************************************
-- Title: DN_DeliveryGetForRepoSP.PRC
-- Developer: ??
-- Date: ??
-- Purpose: Return items for collections/repossession

-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
-- 07/06/11  IP  5.4.4 merge - #3509 - LW73460 - Previously warranty could not be cancelled if an exchange 
--				 was incorrectly made on a product rather than a cancellation. Now returning the warranty
--				 in the Goods Return screen to process the cancellation on the warranty.
-- 13/07/11  IP  RI - #4266 - Changed to look at code category 'WAR' when identifying a warranty.
-- 21/07/11  IP  RI - #3939 - Can no longer determine if a warranty is an electrical or furniture just by the itemno beginning with '19' or 'XW'
--				 therefore added Department column which for warranties is updated as the category that the parent item belongs to i.e (PCE, PCF).
-- 06/09/11  IP  RI - #4534 - UAT31 - Return the RetItemID as the ItemID for warranties.
-- 11/01/12 jec  #9418 Exception Error in GRT screen when tried to return the items which includes installation
-- 04/05/12 jec  #9872 LW74500 - Error when doing Goods Return	
-- 18/06/12 jec #10411 GRT screen should generate 'collect' booking
-- 16/05/12 jec #13491 Identical Replacement	
-- 20/01/14 ip  #17050 Prevent non stocks from being loaded in Goods Return if there is an outstanding cancellation for them.	 
-- **********************************************************************
		 @acctno varchar(12),
		 @accountType varchar(1) OUT,
		 @return int OUTPUT

AS

	DECLARE	@schedqty float,
		@adminitem varchar(10),
		@insitem varchar(10)	


	SET @return = 0			--initialise return code

	DECLARE	@custid varchar(20)

	/* make sure this isn't the PAID & TAKEN account */
	SELECT	@custid = custid 
	FROM		custacct 
	WHERE	acctno = @acctno
	AND		hldorjnt = 'H'
	
	SELECT	@adminitem = adminitemno,
			@insitem = insitemno
	FROM	country	

	IF(@custid NOT LIKE 'PAID & TAKEN%')
	BEGIN
			
		SELECT	@accountType = AT.accttype
		FROM	accttype AT inner join acct A
		ON	AT.genaccttype  = A.accttype 
		WHERE	A.acctno = @acctno
	
		SELECT	D.AcctNo,
			D.AgrmtNo,
			ISNULL(S.ItemNo, '') AS CourtsCode,
			S.IUPC as ItemNo,			-- RI
			L.Quantity,
			S.ItemDescr1,
			S.ItemDescr2,
			S.ColourName,
			L.Price, 
			L.Ordval,
			L.TaxAmt,
			S.Stocklocn,
			sum(D.Quantity) as 'SumQty',
			L.contractno,
			S.ItemType,
			S.Category,
			max(D.DateDel) as DateDel,   -- RD 03/11/05 67697 Modified to get the correct delqty 
			L.ParentItemNo,
			L.ParentLocation,
			S.RefCode,
			--0 AS noOfOpenSRs,
			S.Deleted,                  -- 69647 If item is a deleted item then authorisation required
			d.ItemID,l.ParentItemID,			-- RI
			CAST(' ' as VARCHAR(6)) as 'Department',		-- #9418
			l.ID,		-- #10411
			--CASE WHEN isnull(s.WarrantyType, 'E') = 'F' THEN 1 ELSE 0 END AS IsFree,			-- 15993
			s.WarrantyType,					-- #17883
			isnull(l.WarrantyGroupId,-1) as WarrantyGroupId,
			l.deliveryaddress,					-- #14927
			'N' AS LinkedWarranty,		 -- #17290
			case when s.category in (select code from code c where category='WAR') then s.WarrantyLength else 0 end as WarrantyLength,	-- #17290	
			case when exists(select * from ReadyAssistDetails where acctno = @acctno and itemid = l.itemid and contractno = l.contractno and status = 'Active') then 1 else 0 end as ReadyAssist,  --#18607 - CR15594
			cast('' as datetime) as dateIntoArrears, --#18610 - CR15594
            case when exists(select * from code c where category = 'ANNSERVCONT' and l.itemno = c.code) then 1 else 0 end as AnnualServiceContract
		INTO	#collections
		FROM 	DELIVERY D, LINEITEM L, STOCKITEM S
				--StockInfo sp INNER JOIN StockQuantity sq on sp.ID=sq.ID		-- RI				
		WHERE	D.acctno	= @acctno
		AND 	L.acctno	= @acctno
		--AND 	S.Itemno	= L.ItemNo		-- RI
		AND 	S.ItemID	= L.ItemID
		AND 	S.Stocklocn	= L.Stocklocn
		--AND 	D.itemno	= L.itemno
		AND 	D.itemID	= L.itemID		-- RI
		AND 	D.stocklocn	= L.stocklocn
		AND 	D.contractno	= L.contractno		
		--AND (d.ParentItemID = l.ParentItemID or (l.ParentItemID = 0 and s.category in (12, 82) and l.ordval > 0)) --IP - 20/04/11 #3509 - LW73460
		AND (d.ParentItemID = l.ParentItemID or (l.ParentItemID = 0 and s.category in (select code from code where category = 'WAR') and l.ordval > 0)) --IP - 20/04/11 #3509 - LW73460
		AND 	L.quantity 	> 0
		AND 	D.quantity 	> 0
		AND 	((L.Ordval 	= 0 and L.Price = 0)	
		OR	(L.Ordval 	!= 0 and L.Price != 0))
		--AND	L.ItemNo NOT IN ('DT', 'STAX', 'SD', 'ADDDR', @adminitem, @insitem)
		AND	s.IUPC NOT IN ('DT', 'STAX', 'SD', 'ADDDR', @adminitem, @insitem)		-- RI
		and (isnull(l.WarrantyGroupId,-1)!=0					-- #17677 exclude redeemed warranties
                or (l.WarrantyGroupId = 0 
                        and not exists(select 1 from delivery d2
                                            where d2.acctno = d.acctno
                                            and d2.agrmtno = d.agrmtno
                                            and d2.ItemID = d.ItemID
                                            and d2.stocklocn = d.stocklocn
                                            and d2.contractno  = d.contractno
                                            and d2.delorcoll = 'C')))					
		
		GROUP BY D.AcctNo, D.AgrmtNo, S.ItemNo, S.IUPC, L.Quantity, S.Itemdescr1, S.itemdescr2, S.ColourName, L.price, L.ordval, L.TaxAmt,		-- RI
				 S.stocklocn, L.contractno, S.ItemType,L.ParentItemNo, L.ParentLocation, S.Category, S.RefCode, S.Deleted,
				 D.ItemID,l.ParentItemID,l.ID,s.WarrantyType,isnull(l.WarrantyGroupId,-1),l.deliveryaddress,		-- #17883 #14927
				 s.WarrantyLength,  l.itemid, l.itemno --#18607 - CR15594			-- #17290	
		SET @return = @@error
	
		IF @return = 0
		BEGIN			

		-- #13491 check for outstanding cancellations
			SELECT	c.AcctNo,
				c.AgrmtNo,
				si.IUPC,		
				s.Stocklocn,
				c.ContractNo,
				isnull(sum(s.quantity),0) as total,
				s.ItemID		-- RI
			INTO 	#schedules
			FROM 	lineitembookingschedule s JOIN #collections c
			    	  	   ON s.LineItemID = c.Id	
			    	  	   AND s.ItemID = c.ItemID
			    	  	   AND s.Stocklocn = c.Stocklocn
			    	INNER JOIN StockInfo si on si.ID=s.ItemID		
			WHERE 	s.Quantity < 0
			GROUP 	BY  c.AcctNo, c.AgrmtNo, si.IUPC, s.Stocklocn, c.ContractNo,s.ItemID

			--#17050 - check for outstanding cancellations (non-stocks such as warranties)
			insert into #schedules
				SELECT	c.AcctNo,
				c.AgrmtNo,
				si.IUPC,		
				s.Stocklocn,
				c.ContractNo,
				isnull(sum(s.quantity),0) as total,
				s.ItemID		-- RI
			FROM 	schedule s JOIN #collections c
			    	  	   ON s.acctno = c.acctno 
			    	  	   AND s.ItemID = c.ItemID
			    	  	   AND s.Stocklocn = c.Stocklocn
						   AND s.contractno = c.contractno
			    	INNER JOIN StockInfo si on si.ID=s.ItemID		
			WHERE 	s.Quantity < 0
			GROUP 	BY  c.AcctNo, c.AgrmtNo, si.IUPC, s.Stocklocn, c.ContractNo,s.ItemID	

		END
	
		SET @return = @@error
	
		IF @return = 0
		BEGIN
		    	UPDATE	#collections  
			SET 	sumqty = sumqty + s.total
			FROM 	#schedules s, #collections c
			WHERE   s.AcctNo = c.AcctNo
			 --AND 	s.ItemNo = c.ItemNo
			 AND 	s.ItemID = c.ItemID				-- RI
			 AND 	s.AgrmtNo =c.AgrmtNo
			 AND 	s.Stocklocn = c.Stocklocn
   	  		 AND	s.ContractNo = c.ContractNo
		END

		--#18610 - CR15594 - Set most recent date into arrears for Ready Assist
		--Either after most recent payment or if no payment when account first went
		--into arrears.
		IF @return = 0
		BEGIN
			
			UPDATE #collections
			SET dateIntoArrears = (select min(ad1.datefrom) as datefrom
									from arrearsdaily ad1
									inner join acct a on ad1.acctno = a.acctno
									where ad1.acctno = #collections.acctno
									and ad1.arrears > 0
									and a.arrears > 0
									and a.accttype !='C'
									and ad1.datefrom >= isnull((select max(ad2.datefrom)
															from arrearsdaily ad2
															where ad2.Acctno = ad1.Acctno
															and ad2.arrears < 0), (select min(ad.datefrom)
																					from ArrearsDaily ad
																						where ad.acctno = #collections.acctno
																						and ad.arrears > 0)))
			WHERE ReadyAssist = 1

			--Add a day to date from ArrearsDaily to get the actual day went into arrears
				--Add a day to date from ArrearsDaily to get the actual day went into arrears
			UPDATE #collections
			SET dateIntoArrears = case 
									when dateIntoArrears is not null and cast(dateIntoArrears as time) = '23:59:59'
									then dateadd(day, 1, dateIntoArrears)
								   end
			

		END
	
		SET @return = @@error

		IF @return = 0
		BEGIN
			SELECT	d.AcctNo,
				d.AgrmtNo,
				--d.ItemNo,
				si.IUPC,			-- RI
				d.Stocklocn,
				d.contractno,
				isnull(sum(d.quantity),0) as total,
				d.ItemID			-- RI
			INTO 	#repo
			FROM 	delivery d JOIN #collections c ON d.AcctNo = c.AcctNo
						--AND d.ItemNo = c.ItemNo
						AND d.ItemID = c.ItemID			-- RI
						AND d.AgrmtNo =c.AgrmtNo
						AND d.Stocklocn = c.Stocklocn
						AND d.contractno = c.contractno
					INNER JOIN StockInfo si on si.ID=d.ItemID		-- RI
			WHERE 	d.Quantity < 0
			--GROUP 	BY d.AcctNo, d.AgrmtNo, d.Itemno, d.Stocklocn, d.contractno
			GROUP 	BY d.AcctNo, d.AgrmtNo, si.IUPC, d.Stocklocn, d.contractno,d.ItemID			-- RI
		END
		SET @return = @@error

		IF @return = 0
		BEGIN
		    	UPDATE	#collections  
			SET 	sumqty = sumqty + r.total
			FROM 	#repo r, #collections c
			WHERE   r.AcctNo = c.AcctNo
			 --AND 	r.ItemNo = c.ItemNo
			 AND 	r.ItemID = c.ItemID			-- RI
			 AND 	r.AgrmtNo =c.AgrmtNo
			 AND 	r.Stocklocn = c.Stocklocn
			 AND	r.contractno = c.contractno
		END
		SET @return = @@error
	
		IF @return = 0
		BEGIN
			DELETE	
			FROM	#collections
			WHERE 	sumqty  = 0
		END
	
		SET @return = @@error
		
		------UAT 380 Data set to include the number of open SR's 
		----IF @return = 0
		----BEGIN
		----    UPDATE	#collections  
		----	SET 	noOfOpenSRs = (SELECT COUNT(ServiceRequestNo)
		----	FROM 	SR_ServiceRequest sr
		----	WHERE   sr.acctno = @acctno AND status <> 'C')
		----END
		----SET @return = @@ERROR

		-- #17290
		IF @return = 0
		BEGIN
		    UPDATE	#collections  
			SET 	LinkedWarranty = 'Y'
			FROM	#collections c			
			WHERE EXISTS(select * from #collections c1	
						    inner join warranty.WarrantySale ws on ws.CustomerAccount = c1.acctno   --#18374
							and ws.WarrantyContractNo = c1.contractno
							where c1.itemtype = 'N' 
							and c1.ParentItemNo = c.ItemNo and c1.ParentLocation = c.StockLocn							
							--and dateadd(month, c1.warrantylength,c1.datedel) > getdate()) 
							and dateadd(month, ws.WarrantyLength,ws.EffectiveDate) > getdate())		--#18374
			AND itemtype = 'S'

		END
		SET @return = @@ERROR
		
		--IP - 21/07/11 - RI - #3939 - Update department for warranties (this will be the department that the parent item is from)
		IF @return = 0
		BEGIN
			UPDATE #collections
			SET Department = isnull((select distinct co.category from code co				-- #9872
								inner join #collections c1 on c1.category = co.code
								and c1.ItemID = c.ParentItemID
								where co.category in ('PCE', 'PCF', 'PCO', 'PCW','PCDIS')	-- #9418
								),'')
			FROM #collections c
			where c.category in (select code from code co where co.category = 'WAR')
		END
		SET @return = @@ERROR
		
		--IP - 21/07/11 - RI - #3939 - Update department for other items which are not warranties
		IF @return = 0
		BEGIN
			UPDATE #collections
			SET Department = isnull((select distinct co.category from code co				-- #9872
								inner join #collections c1 on c1.category = co.code
								and c1.ItemID = c.ItemID
								and c1.ParentItemId=c.ParentItemId						-- #9418
								and c1.ContractNo=c.ContractNo							-- #9872
								where co.category in ('PCE', 'PCF', 'PCO', 'PCW','PCDIS')	-- #9418 
								),'')
			FROM #collections c
			where c.category not in (select code from code co where co.category = 'WAR')
		END
		SET @return = @@ERROR
		
		IF @return = 0
		BEGIN
			SELECT	
				C.AcctNo,
				C.AgrmtNo,
				C.ItemNo,
				C.CourtsCode,
				C.Quantity as 'QuantityOrdered',
				C.ItemDescr1,
				C.ItemDescr2,				
				C.ColourName,
				C.Price,
				C.OrdVal,
				C.TaxAmt,
				C.StockLocn,
				C.SumQty as 'QuantityDelivered',
				C.contractno,
				C.itemtype,
				C.category,		-- RI
				C.DateDel,
				C.ParentItemNo,
				C.ParentLocation,
				C.RefCode,
				--C.noOfOpenSRs,
				C.Deleted,
				C.ItemID,
				C.ParentItemID,	-- RI
				case when ISNULL(cd.category,'')='WAR' then 1 else 0 end as Warranty,	-- RI
				-- Return Repossession orig cost price reduction % and Repossession Selling price uplift on Repo Cost % from Code table
				ABS(CAST(ISNULL(rpv.reference,'100') as NUMERIC(7,2))) as RepoCostPcent,	-- RI 
				ABS(CAST(ISNULL(rpv.additional,'0') as NUMERIC(7,2))) as RepoSellPcent,	-- RI 
				--ISNULL(R.ID, 0) AS RetItemId,
				case when ISNULL(cd.category,'')='WAR' then C.ItemID else ISNULL(R.ID, 0) end AS RetItemId,	--IP - 06/09/11 - RI - #4534 - UAT31
				C.Department,				--IP - 21/07/11 - RI - #3939
				c.ID as LineItemId,			-- #10411
				c.WarrantyType,					-- #17883 #15993
				c.WarrantyGroupId,
				c.DeliveryAddress,				-- #14927
				c.LinkedWarranty,			--IP - #8746 - CR8394
				c.WarrantyLength,				-- #17290
				c.ReadyAssist,					--#18607 - CR15594
				case 
                    when 
                        c.dateIntoArrears is not null and dbo.fn_ReadyAssistMonths(ra.RAContractDate, c.dateIntoArrears) > cra.reference 
                        then cast(isnull(cra.reference * cast(cra.additional as decimal(11,2)),0) as decimal(11,2)) 
                    when 
                        c.dateIntoArrears is not null and dbo.fn_ReadyAssistMonths(ra.RAContractDate, c.dateIntoArrears) <= cra.reference 
                        then cast(isnull(dbo.fn_ReadyAssistMonths(ra.RAContractDate, c.dateIntoArrears) * cast(cra.additional as decimal(11,2)),0) as decimal(11,2))  --#18610 - CR15594
                    when 
                        c.dateIntoArrears is null and dbo.fn_ReadyAssistMonths(ra.RAContractDate, getdate()) > cra.reference 
                        then cast(isnull(cra.reference * cast(cra.additional as decimal(11,2)),0) as decimal(11,2)) 
				    when 
                        c.dateIntoArrears is null and dbo.fn_ReadyAssistMonths(ra.RAContractDate, getdate()) <= cra.reference 
                        then cast(isnull(dbo.fn_ReadyAssistMonths(ra.RAContractDate, getdate()) * cast(cra.additional as decimal(11,2)),0) as decimal(11,2)) 
                    else 0
                end as ReadyAssistUsed,			--#18607,			--#18607
                case 
                    when ascr.additional = 1                --Full Refund
                        then 0                              --Full Refund no need to post ASC or ASR transaction as remaining amount after collection can be refunded.
                    --else cast(isnull((cast(c.price / ascr.reference as decimal (11,2))) * dbo.fn_AnnualServiceContractMonths(c.DateDel, getdate()),0) as decimal (11,2)) --Pro Rata
                    else cast(isnull((c.price / ascr.reference) * dbo.fn_AnnualServiceContractMonths(c.DateDel, getdate()),0) as decimal (11,2)) --Pro Rata
                end as AnnualServiceContractUsed,
                c.AnnualServiceContract
			FROM	#collections c 
				LEFT OUTER JOIN Code cd on CAST(cd.code as INT)=c.category and cd.category='WAR'	-- RI
				LEFT OUTER JOIN Code rpv on CAST(rpv.code as INT)=c.category and rpv.category='RPV'	-- RI
				LEFT JOIN dbo.StockInfo R ON R.IUPC = C.ItemNo AND R.RepossessedItem = 1
				LEFT JOIN ReadyAssistDetails ra on ra.acctno = c.acctno and ra.itemid = c.itemid and ra.contractno = c.contractno and ra.status = 'Active'			--#18607 - CR15594
				LEFT JOIN stockinfo sra on sra.id = ra.itemid																										--#18607 - CR15594																		
				LEFT JOIN code cra on cra.code = sra.iupc and cra.category = 'RDYAST'																				--#18607 - CR15594
                LEFT JOIN code ascr on ascr.code = c.ItemNo and ascr.category = 'ANNSERVCONT'       --Annual Service Contract
			
			select Addtype from custaddress ca 
			where custid=@custid
				and datemoved is null

		END

	END
	
	SET @return = @@error
	GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

-- End End End End End End End End End End End End End End End End End End End End End End End End End End End
