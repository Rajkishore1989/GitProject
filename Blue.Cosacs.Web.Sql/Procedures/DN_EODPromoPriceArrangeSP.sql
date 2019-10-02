

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[DN_EODPromoPriceArrangeSP]') and OBJECTPROPERTY(id, N'IsProcedure') = 1)
drop procedure dbo.[DN_EODPromoPriceArrangeSP]
GO
CREATE PROCEDURE [dbo].[DN_EODPromoPriceArrangeSP]
		@interface varchar(10),
		@runno int


		--------------------------------------------------------------------------------
--
-- Project      : CoSACS dotNET ? 2003 Strategic Thought Ltd.
-- File Name    : EODPromoPriceArrangeSP.sql
-- File Type    : MSSQL Server Stored Procedure Script
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
--6-11-2018	SB		CR#ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
--
--------------------------------------------------------------------------------
        
AS

	DECLARE	@return int
    SET 	@return = 0			--initialise return code

	DECLARE @branch smallint
	DECLARE @itemno varchar(10)
	DECLARE @stocklocn smallint
	DECLARE @hporcash char(1)
	DECLARE @fromdate datetime
	DECLARE @todate datetime
	DECLARE @unitprice float
	DECLARE	@text varchar(200)
	DECLARE @datetest datetime

	SELECT	@branch = convert(smallint,value)
	FROM	countrymaintenance
	WHERE	codename = 'hobranchno'

    /* Instead of having a temp TABLE with 6 groups of price AND date info, we rearrange    */
    /* the data INTO one TABLE with many rows AND only 1 group of price AND date info.      */
    /* This makes it infinitely easier when populating/amending the promoprice TABLE.       */

    /* Weed out blank rows while we're at it */
    
	IF EXISTS (SELECT Table_Name FROM INFORMATION_SCHEMA.tables
			   WHERE  Table_Name = 'temp_promoload')
	BEGIN
		DROP TABLE temp_promoload
		SET @return = @@error
	END	

    /* FR 992 */

    SELECT @datetest = CONVERT(datetime,'01/06/00');

	IF(@return = 0)
	BEGIN
	    IF(@datetest = '1-jun-2000')/* dmy format */
		BEGIN
	        UPDATE temp_rawpromoload SET
	        datefromhp1 = (LEFT(RIGHT(datefromhp1,4),2) + LEFT(datefromhp1,2) + RIGHT(datefromhp1,2)),
	        datetohp1 = (LEFT(RIGHT(datetohp1,4),2) + LEFT(datetohp1,2) + RIGHT(datetohp1,2)) ,
	        datefromhp2 = (LEFT(RIGHT(datefromhp2,4),2) + LEFT(datefromhp2,2) + RIGHT(datefromhp2,2)),
	        datetohp2 = (LEFT(RIGHT(datetohp2,4),2) + LEFT(datetohp2,2) + RIGHT(datetohp2,2)) ,
	        datefromhp3 = (LEFT(RIGHT(datefromhp3,4),2) + LEFT(datefromhp3,2) + RIGHT(datefromhp3,2)),
	        datetohp3 = (LEFT(RIGHT(datetohp3,4),2) + LEFT(datetohp3,2) + RIGHT(datetohp3,2))
		END
	
		SET @return = @@error
    END

	IF(@return = 0)
	BEGIN
	    SELECT	IDENTITY(INT,1,1) AS lineid,
				@branch as origbr,
	            itemno,
	            CONVERT(int,branchno) as stocklocn,
	            'H' as hporcash,
				convert(datetime, '20' + substring(datefromhp1, 5, 2) + '-' + substring(datefromhp1, 3, 2) + '-' + left(datefromhp1, 2) + ' ' + substring(datefromhp1, 7,2) + ':' + substring(datefromhp1, 9,2) + ':' + right(datefromhp1, 2), 120) as fromdate,
				convert(datetime, '20' + substring(datetohp1, 5, 2) + '-' + substring(datetohp1, 3, 2) + '-' + left(datetohp1, 2) + ' ' + substring(datetohp1, 7,2) + ':' + substring(datetohp1, 9,2) + ':' + right(datetohp1, 2), 120) as todate,

	            --CONVERT(datetime,(LEFT(RIGHT(datefromhp1,4),2) ) + '-' + LEFT(datefromhp1,2) + '-' + RIGHT(datefromhp1,2)) as fromdate,
	            --CONVERT(datetime,(LEFT(RIGHT(datetohp1,4),2)) + '-' + LEFT(datetohp1,2) + '-' + RIGHT(datetohp1,2)) as todate,
	            CONVERT(float,pricehp1) as unitprice,
	            CONVERT(smallint,(0)) as duprow,
				promotionid
	    INTO	temp_promoload
	    FROM  	temp_rawpromoload
	    WHERE 	datefromhp1 != '000000'
	    AND   	datetohp1 != '000000'
	    AND   	CONVERT(float,pricehp1) != 0
	                    
		SET @return = @@error
	END

	/*IF(@return = 0)
	BEGIN
    	ALTER TABLE temp_promoload ADD tid integer IDENTITY
    
		SET @return = @@error
	END*/

	IF(@return = 0)
	BEGIN
	
	    INSERT INTO temp_promoload (origbr, itemno, stocklocn, hporcash, fromdate, todate, unitprice, duprow, promotionid)
		
		
	    
		SELECT  @branch,
	            itemno,
	            CONVERT(int,branchno),
	            'H',
	            --CONVERT(datetime,LEFT(RIGHT(datefromhp2,4),2) + '-' + LEFT(datefromhp2,2) + '-' + RIGHT(datefromhp2,2)),
	            --CONVERT(datetime,LEFT(RIGHT(datetohp2,4),2) + '-' + LEFT(datetohp2,2) + '-' +RIGHT(datetohp2,2)),
				convert(datetime, '20' + substring(datefromhp2, 5, 2) + '-' + substring(datefromhp2, 3, 2) + '-' + left(datefromhp2, 2) + ' ' + substring(datefromhp2, 7,2) + ':' + substring(datefromhp2, 9,2) + ':' + right(datefromhp2, 2), 120) ,
				convert(datetime, '20' + substring(datetohp2, 5, 2) + '-' + substring(datetohp2, 3, 2) + '-' + left(datetohp2, 2) + ' ' + substring(datetohp2, 7,2) + ':' + substring(datetohp2, 9,2) + ':' + right(datetohp2, 2), 120) ,


	            CONVERT(float,pricehp2),
	            0,
				promotionid
	    FROM    temp_rawpromoload
	    WHERE   datefromhp2 != '000000'
	    AND     datetohp2 != '000000'
	    AND     CONVERT(float,pricehp2) != 0;       
	
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    INSERT INTO temp_promoload (origbr, itemno, stocklocn, hporcash, fromdate, todate, unitprice, duprow, promotionid)
	    SELECT  @branch,
	            itemno,
	            CONVERT(int,branchno),
	            'H',
	            --CONVERT(datetime,LEFT(RIGHT(datefromhp3,4),2) + '-' + LEFT(datefromhp3,2) + '-' + RIGHT(datefromhp3,2)),
	            --CONVERT(datetime,LEFT(RIGHT(datetohp3,4),2) + '-' + LEFT(datetohp3,2) + '-' + RIGHT(datetohp3,2)),
				convert(datetime, '20' + substring(datefromhp3, 5, 2) + '-' + substring(datefromhp3, 3, 2) + '-' + left(datefromhp3, 2) + ' ' + substring(datefromhp3, 7,2) + ':' + substring(datefromhp3, 9,2) + ':' + right(datefromhp3, 2), 120) ,
				convert(datetime, '20' + substring(datetohp3, 5, 2) + '-' + substring(datetohp3, 3, 2) + '-' + left(datetohp3, 2) + ' ' + substring(datetohp3, 7,2) + ':' + substring(datetohp3, 9,2) + ':' + right(datetohp3, 2), 120) ,


	            CONVERT(float,pricehp3),
	            0,
				promotionid
	    FROM    temp_rawpromoload
	    WHERE   datefromhp3 != '000000'
	    AND     datetohp3 != '000000'
	    AND     CONVERT(float,pricehp3) != 0;       
	
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    INSERT INTO temp_promoload (origbr, itemno, stocklocn, hporcash, fromdate, todate, unitprice, duprow, promotionid)
	    SELECT  @branch,
	            itemno,
	            CONVERT(int,branchno),
	            'C',
	            --CONVERT(datetime,LEFT(RIGHT(datefromcash1,4),2) + '-' + LEFT(datefromcash1,2) + '-' + RIGHT(datefromcash1,2)),
	            --CONVERT(datetime,LEFT(RIGHT(datetocash1,4),2) + '-' + LEFT(datetocash1,2) + '-' + RIGHT(datetocash1,2)),
				convert(datetime, '20' + substring(datefromcash1, 5, 2) + '-' + substring(datefromcash1, 3, 2) + '-' + left(datefromcash1, 2) + ' ' + substring(datefromcash1, 7,2) + ':' + substring(datefromcash1, 9,2) + ':' + right(datefromcash1, 2), 120) ,
				convert(datetime, '20' + substring(datetocash1, 5, 2) + '-' + substring(datetocash1, 3, 2) + '-' + left(datetocash1, 2) + ' ' + substring(datetocash1, 7,2) + ':' + substring(datetocash1, 9,2) + ':' + right(datetocash1, 2), 120) ,

	            CONVERT(float,pricecash1),
	            0,
				promotionid
	    FROM    temp_rawpromoload
	    WHERE   datefromcash1 != '000000'
	    AND     datetocash1 != '000000'
	    AND     CONVERT(float,pricecash1) != 0;     
	
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    INSERT INTO temp_promoload (origbr, itemno, stocklocn, hporcash, fromdate, todate, unitprice, duprow, promotionid)
	    SELECT  @branch,
	            itemno,
	            CONVERT(int,branchno),
	            'C',
	            CONVERT(datetime,LEFT(RIGHT(datefromcash2,4),2) + '-' + LEFT(datefromcash2,2) + '-' + RIGHT(datefromcash2,2)),
	            CONVERT(datetime,LEFT(RIGHT(datetocash2,4),2) + '-' + LEFT(datetocash2,2) + '-' + RIGHT(datetocash2,2)),
	            CONVERT(float,pricecash2),
	            0, promotionid
	    FROM    temp_rawpromoload
	    WHERE   datefromcash2 != '000000'
	    AND     datetocash2 != '000000'
	    AND     CONVERT(float,pricecash2) != 0;     
	
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    INSERT INTO temp_promoload (origbr, itemno, stocklocn, hporcash, fromdate, todate, unitprice, duprow, promotionid)
	    SELECT  @branch,
	            itemno,
	            CONVERT(int,branchno),
	            'C',
	            CONVERT(datetime,LEFT(RIGHT(datefromcash3,4),2) + '-' + LEFT(datefromcash3,2) + '-' + RIGHT(datefromcash3,2)),
	            CONVERT(datetime,LEFT(RIGHT(datetocash3,4),2) + '-' + LEFT(datetocash3,2) + '-' + RIGHT(datetocash3,2)),
	            CONVERT(float,pricecash3),
	            0, promotionid
	    FROM    temp_rawpromoload
	    WHERE   datefromcash3 != '000000'
	    AND     datetocash3 != '000000'
	    AND     CONVERT(float,pricecash3) != 0;     
	
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
    	/* Before MODIFYing, check for duplicates */
        UPDATE  temp_promoload
        SET     duprow = 1
        WHERE   RTRIM(LTRIM(itemno)) + RTRIM(LTRIM(CONVERT(varchar,stocklocn))) + RTRIM(LTRIM(hporcash)) + RTRIM(LTRIM(CONVERT(varchar,fromdate)))
        IN (
            SELECT RTRIM (LTRIM(t1.itemno)) + RTRIM(LTRIM(CONVERT(varchar,t1.stocklocn))) + RTRIM(LTRIM(t1.hporcash)) +
                                                RTRIM(LTRIM(CONVERT(varchar,t1.fromdate)))
            FROM    temp_promoload t1, temp_promoload t2
            WHERE   t1.itemno = t2.itemno
            AND     t1.stocklocn = t2.stocklocn
            AND     t1.hporcash = t2.hporcash
            AND     t1.fromdate = t2.fromdate
            AND     t1.lineid != t2.lineid 
           )
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
		DECLARE duplicate_cursor CURSOR FOR 
	    SELECT  itemno, stocklocn, hporcash,
	            fromdate, todate, unitprice
	    FROM    temp_promoload
	    WHERE   duprow = 1

		OPEN duplicate_cursor
		
		FETCH NEXT FROM duplicate_cursor 
		INTO	@itemno, @stocklocn,@hporcash,
				@fromdate, @todate, @unitprice
		
		WHILE @@FETCH_STATUS = 0
		BEGIN
	        SET @text = @itemno + ',' + convert(varchar,@stocklocn) + ',' +
	                convert(varchar,@hporcash) + ',' + convert(varchar,@fromdate,106) + ',' + 
					convert(varchar,@todate,106)

	   		INSERT INTO Interfaceerror
			(
				interface, runno,errordate,
				severity,errortext
			)   
			VALUES
			(	
				@interface, @runno, GETDATE(),
				'W', 'Duplicate row: ' + @text
			)   

			FETCH NEXT FROM duplicate_cursor 
			INTO	@itemno, @stocklocn,@hporcash,
					@fromdate, @todate, @unitprice
		END

		CLOSE duplicate_cursor
		DEALLOCATE duplicate_cursor

		SET @return = @@error
	END
	
	IF(@return = 0)
	BEGIN
	    DELETE 
		FROM	temp_promoload
	    WHERE 	duprow = 1;
	
		SET @return = @@error
	END
    
	IF(@return = 0)
	BEGIN
		CREATE CLUSTERED INDEX ixtemp_promoload ON temp_promoload (itemno, stocklocn, hporcash, fromdate)
    
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    /* As a fudge (we're currently on OpenROAD v3.5/02 which is non Y2K compliant) then */
	    /* add 100 years to the dates WHERE the year part is before 50. ie 1.1.01 gets SET  */
	    /* to 1.1.2001                                                                      */
	
	    /* DSR 3/6/2003 Changed for SQL Server */
	    UPDATE	temp_promoload
	    SET     fromdate = DATEADD(Year, +100, fromdate)
	    WHERE   fromdate < CONVERT(SMALLDATETIME, '01-01-1950', 105)
	    
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    /* DSR 3/6/2003 Changed for SQL Server */
	    UPDATE  temp_promoload
	    SET     todate = DATEADD(Year, +100, todate)
	    WHERE   todate < CONVERT(SMALLDATETIME, '01-01-1950', 105)
	    
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    /* DSR 3/6/2003 Found some dates > 2050 so added reverse */
	    UPDATE  temp_promoload
	    SET     fromdate = DATEADD(Year, -100, fromdate)
	    WHERE   fromdate >= CONVERT(SMALLDATETIME, '01-01-2050', 105)
	    
		SET @return = @@error
	END

	IF(@return = 0)
	BEGIN
	    /* DSR 3/6/2003 Found some dates > 2050 so added reverse */
	    UPDATE  temp_promoload
	    SET     todate = DATEADD(Year, -100, todate)
	    WHERE   todate >= CONVERT(SMALLDATETIME, '01-01-2050', 105)
	    
		SET @return = @@error
	END

