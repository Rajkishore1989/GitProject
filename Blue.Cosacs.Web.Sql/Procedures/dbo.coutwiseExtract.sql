SET QUOTED_IDENTIFIER OFF
GO
SET ANSI_NULLS ON
GO

if exists (select * from dbo.sysobjects where id = object_id(N'[dbo].coutwiseExtract') 
            and OBJECTPROPERTY(id, N'IsProcedure') = 1)
BEGIN
    DROP PROCEDURE dbo.coutwiseExtract
END
GO

-- ==========================================================
-- Author:		Iliya Zanev
-- Create date: 03 April 2014
-- Description:	Coutwise software extract of sales activity
-- CR 16304
-- ==========================================================

CREATE PROCEDURE dbo.coutwiseExtract
(
    @dateFrom DATE,
    @dateFinish DATE
)
AS

--Drop temporary tables
IF OBJECT_ID('tempdb..#SLSData','U') IS NOT NULL 
			DROP TABLE #SLSData

IF OBJECT_ID('tempdb..##tempExport','U') IS NOT NULL 
			DROP TABLE ##tempExport

DECLARE @directory VARCHAR(100),
		@filename VARCHAR(50),
		@bcpCommand VARCHAR(5000),
        @hour SMALLINT

--Create temporary table to hold all data for the different extract records 
CREATE TABLE #SLSData
(  
    branchNo SMALLINT,
    dateOfAgreement DATE,
    agreementHour SMALLINT,
    variableValue DECIMAL(18,2),
    recordType CHAR(3)
)

--SLS - Sales Value Record
--The sum of all agreement totals for accounts opened within a specific hour
--Only consider accounts and Cash&Go agreements created within that hour
INSERT INTO #SLSData
SELECT LEFT(a.acctno, 3) AS branchno, 
       CAST(a.dateacctopen AS DATE) AS dateOfAgreement,
       DATEPART(HOUR, a.dateacctopen) AS agreementHour, 
       SUM(aa.NewAgreementTotal) AS totalAgreement,
       'SLS' AS recordType
FROM acct a  
INNER JOIN agreementAudit aa
ON a.acctno = aa.acctno
    AND aa.datechange = (SELECT MAX(datechange) 
                         FROM agreementAudit
                         WHERE acctno = a.acctno
                            AND DATEPART(HOUR, a.dateacctopen) = DATEPART(HOUR, datechange)
                            AND CAST(a.dateacctopen AS DATE) = CAST(datechange AS DATE)
                        )
WHERE a.dateacctopen >= @dateFrom 
    AND a.dateacctopen < @dateFinish
    AND a.accttype != 'S'
GROUP BY LEFT(a.acctno, 3), 
         CAST(a.dateacctopen AS DATE),
         DATEPART(HOUR, a.dateacctopen)
UNION ALL
--POS (Paid and Taken)
SELECT s.BranchNo AS branchno,
	   CAST(s.CreatedOn AS DATE) AS dateOfAgreement,
	   DATEPART(HOUR, s.CreatedOn) AS agreementHour,
	   SUM(s.TotalAmount) AS totalAgreement,
	   'SLS' AS recordType
FROM Sales.[Order] s
WHERE s.CreatedOn >= @dateFrom 
    AND s.CreatedOn < @dateFinish
GROUP BY s.BranchNo, 
         CAST(s.CreatedOn AS DATE),
         DATEPART(HOUR, s.CreatedOn)


--TRN - Transaction Count (Number of accounts opened(with items added on them) + Cash&Go agreements within a specific hour)
--Only consider accounts and items added within that hour
INSERT INTO #SLSData
SELECT LEFT(a.acctno, 3) AS branchno, 
       CAST(a.dateacctopen AS DATE) AS dateOfAgreement,
       DATEPART(HOUR, a.dateacctopen) AS agreementHour, 
       COUNT(distinct a.acctno) AS totalAgreement,
       'TRN' AS recordType
FROM acct a
INNER JOIN agreementAudit aa
ON a.acctno = aa.acctno
    AND aa.datechange = (SELECT MAX(datechange) FROM agreementAudit
                         WHERE acctno = a.acctno
                            AND DATEPART(HOUR, a.dateacctopen) = DATEPART(HOUR, Datechange)
                            AND CAST(a.dateacctopen AS DATE) = CAST(Datechange AS DATE)
                        )       
WHERE a.dateacctopen >= @dateFrom 
    AND a.dateacctopen < @dateFinish
    AND a.accttype != 'S'
    AND aa.NewAgreementTotal > 0
GROUP BY LEFT(a.acctno, 3), 
       CAST(a.dateacctopen AS DATE),
       DATEPART(HOUR, a.dateacctopen)
UNION ALL
--Special Accounts (Paid and Taken)
SELECT s.BranchNo AS branchno,
	   CAST(s.CreatedOn AS DATE) AS dateOfAgreement,
	   DATEPART(HOUR, s.CreatedOn) AS agreementHour,
	   COUNT(s.Id) AS totalAgreement,
	   'TRN' AS recordType
FROM Sales.[Order] s
WHERE s.CreatedOn >= @dateFrom 
    AND s.CreatedOn < @dateFinish
GROUP BY s.BranchNo, 
         CAST(s.CreatedOn AS DATE),
         DATEPART(HOUR, s.CreatedOn)      

--ITM - Quantity of items sold within an hour
--Exclude kit products but take into consideration component quantities      
--Discounts are not to be included as per the requirements   
--Only consider accounts and items added within that hour        
INSERT INTO #SLSData
SELECT LEFT(la.acctno, 3) AS branchno, 
       CAST(la.Datechange AS DATE) AS dateOfAgreement,
       DATEPART(HOUR, la.Datechange) AS agreementHour, 
       SUM(la.QuantityAfter - la.QuantityBefore) AS totalAgreement,
       'ITM' AS recordType
FROM LineitemAudit la
INNER JOIN acct a
ON a.acctno = la.acctno
    AND DATEPART(HOUR, a.dateacctopen) = DATEPART(HOUR, la.Datechange)
    AND CAST(a.dateacctopen AS DATE) = CAST(la.Datechange AS DATE)
WHERE a.dateacctopen >= @dateFrom 
    AND a.dateacctopen < @dateFinish
    AND a.accttype != 'S'
    AND la.ItemID NOT IN (SELECT id
                          FROM StockInfo
                          WHERE category IN (SELECT code
                                             FROM code
                                             WHERE category = 'PCDIS')
                          UNION
                          SELECT DISTINCT ItemID FROM kitproduct
                         )
GROUP BY LEFT(la.acctno, 3), 
         CAST(la.Datechange AS DATE),
         DATEPART(HOUR, la.Datechange)
UNION ALL
SELECT LEFT(la.acctno, 3) AS branchno, 
       CAST(la.Datechange AS DATE) AS dateOfAgreement,
       DATEPART(HOUR, la.Datechange) AS agreementHour, 
       SUM(la.QuantityAfter - la.QuantityBefore) AS totalAgreement,
       'ITM' AS recordType
FROM LineitemAudit la
INNER JOIN acct a
ON a.acctno = la.acctno
INNER JOIN Sales.[Order] s
ON s.Id = la.agrmtno
AND DATEPART(HOUR, s.CreatedOn) = DATEPART(HOUR, la.Datechange)
AND CAST(s.CreatedOn AS DATE) = CAST(la.Datechange AS DATE)
WHERE s.CreatedOn >= @dateFrom 
    AND s.CreatedOn < @dateFinish
    AND a.accttype = 'S'
    AND la.ItemID NOT IN (SELECT id
                          FROM StockInfo
                          WHERE category IN (SELECT code
                                             FROM code
                                             WHERE category = 'PCDIS')
                          UNION
                          SELECT DISTINCT ItemID FROM kitproduct
                         )
GROUP BY LEFT(la.acctno, 3), 
         CAST(la.Datechange AS DATE),
         DATEPART(HOUR, la.Datechange)


DECLARE exportCursor CURSOR FOR
SELECT DISTINCT agreementHour
FROM #SLSData
ORDER BY agreementHour

OPEN exportCursor

FETCH NEXT FROM exportCursor
INTO @hour

WHILE @@FETCH_STATUS = 0
BEGIN
    --set all working variables
    SELECT @directory = value FROM CountryMaintenance WHERE CodeName = 'systemdrive'
    SELECT @filename = CONVERT(VARCHAR, dateOfAgreement, 112) FROM #SLSData WHERE agreementHour = @hour
    SET @filename = @filename + RIGHT('0' + CAST(@hour AS VARCHAR(2)), 2)
    SELECT @filename = @filename + c.ISOCountryCode + '.SLS' FROM country c

    SET @directory += '\' + @filename
    SET @bcpCommand = 'BCP ..##tempExport out ' + @directory + ' -c -t^| -Usa -P'	    

    --Get data for the export
    SELECT * INTO ##tempExport FROM
    (
	    SELECT sd.recordType + 
               RIGHT('000000' + CAST(sd.branchNo AS VARCHAR), 6) +
               CAST(DATEPART(YEAR, sd.dateOfAgreement) AS VARCHAR)+ 
               RIGHT('0' + CAST(DATEPART(MONTH, sd.dateOfAgreement) AS VARCHAR), 2) +
               RIGHT('0' + CAST(DATEPART(DAY, sd.dateOfAgreement) AS VARCHAR), 2) +
               RIGHT('0' + CAST(@hour AS VARCHAR), 2) +
               RIGHT('000000000000000' + CAST(ROUND(SUM(sd.variableValue), 2) AS VARCHAR), 15) AS records
        FROM #SLSData sd
        WHERE sd.agreementHour = @hour
        GROUP BY sd.recordType, sd.branchNo, sd.dateOfAgreement
    ) AS tmp

EXEC MASTER..xp_cmdshell @bcpCommand

IF OBJECT_ID('tempdb..##tempExport','U') IS NOT NULL 
DROP TABLE ##tempExport

FETCH NEXT FROM exportCursor
INTO @hour

END
CLOSE exportCursor;
DEALLOCATE exportCursor;


--Export Store Activity Data/Opening Hours

SELECT @filename = UPPER(countryname) + '.CSV' FROM country
		
SELECT @directory = value + '\' + @filename FROM CountryMaintenance WHERE CodeName = 'systemdrive'

SET @bcpCommand = 'BCP ..##tempOpeningHours out ' + @directory + ' -c -t, -Usa -P'

SELECT * INTO ##tempOpeningHours FROM
(
	SELECT 'Store' AS Store, 
           'MonOpen' AS MonOpen, 
           'MonClose' AS MonClose, 
           'TueOpen' AS TueOpen, 
           'TueClose' AS TueClose, 
           'WedOpen' AS WedOpen, 
           'WedClose' AS WedClose, 
           'ThuOpen' AS ThuOpen, 
           'ThuClose' AS ThuClose, 
           'FriOpen' AS FriOpen, 
           'FriClose' AS FriClose, 
           'SatOpen' AS SatOpen, 
           'SatClose' AS SatClose, 
           'SunOpen' AS SunOpen, 
           'SunClose' AS SunClose
	UNION ALL
	SELECT CAST(b.BranchNumber AS VARCHAR) AS Store,
           ISNULL(REPLACE(LEFT(b.MondayOpen, 5), ':', ''), '0000') AS MonOpen,
           ISNULL(REPLACE(LEFT(b.MondayClose, 5), ':', ''), '0000') AS MonClose,
           ISNULL(REPLACE(LEFT(b.TuesdayOpen, 5), ':', ''), '0000') AS TueOpen,
           ISNULL(REPLACE(LEFT(b.TuesdayClose, 5), ':', ''), '0000') AS TueClose,
           ISNULL(REPLACE(LEFT(b.WednesdayOpen, 5), ':', ''), '0000') AS WedOpen,
           ISNULL(REPLACE(LEFT(b.WednesdayClose, 5), ':', ''), '0000') AS WedClose,
           ISNULL(REPLACE(LEFT(b.ThursdayOpen, 5), ':', ''), '0000') AS ThuOpen,
           ISNULL(REPLACE(LEFT(b.ThursdayClose, 5), ':', ''), '0000') AS ThuClose,
           ISNULL(REPLACE(LEFT(b.FridayOpen, 5), ':', ''), '0000') AS FriOpen,
           ISNULL(REPLACE(LEFT(b.FridayClose, 5), ':', ''), '0000') AS FriClose,
           ISNULL(REPLACE(LEFT(b.SaturdayOpen, 5), ':', ''), '0000') AS SatOpen,
           ISNULL(REPLACE(LEFT(b.SaturdayClose, 5), ':', ''), '0000') AS SatClose,
           ISNULL(REPLACE(LEFT(b.SundayOpen, 5), ':', ''), '0000') AS SunOpen,
           ISNULL(REPLACE(LEFT(b.SundayClose, 5), ':', ''), '0000') AS SunClose    
    FROM [Admin].BranchOpeningHours b
) AS tmp

EXEC master..xp_cmdshell @bcpCommand

IF OBJECT_ID('tempdb..#SLSData','U') IS NOT NULL 
			DROP TABLE #SLSData
IF OBJECT_ID('tempdb..##tempOpeningHours','U') IS NOT NULL 
			DROP TABLE ##tempOpeningHours

GO