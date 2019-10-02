IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[Merchandising.WTRFasciaView]'))
    DROP VIEW [Merchandising].[Merchandising.WTRFasciaView]
GO

CREATE VIEW [Merchandising].[Merchandising.WTRFasciaView]
AS

    SELECT 'Courts' as FasciaName, 1 as FasciaId
    UNION
    SELECT 'Courts Optical' as FasciaName, 2 as FasciaId
    UNION
    SELECT 'Lucky Dollar' as FasciaName, 3 as FasciaId
    UNION
    SELECT 'Tropigas' as FasciaName, 4 as FasciaId
    UNION
    SELECT 'Radio Shack' as FasciaName, 5 as FasciaId
	UNION
	SELECT 'Ashley Home Store' as FasciaName, 6 as FasciaId
	UNION
	SELECT 'Ready Cash' as FasciaName, 7 as FasciaId
	UNION
	SELECT 'AMC Unicon' as FasciaName, 8 as FasciaId
	UNION
	SELECT 'OMNI' as FasciaName, 9 as FasciaId
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRRebatesView]'))
    DROP VIEW [Merchandising].[WTRRebatesView]
GO

CREATE VIEW [Merchandising].[WTRRebatesView]
AS 

WITH Data(TransactionDate, Fascia, LocationId, LocationName, Price, GrossProfit)
AS 
(
    SELECT CAST(d.datetrans AS DATE) AS TransactionDate
           , l.Fascia
           , l.SalesId AS LocationId
           , l.Name AS LocationName
           , SUM(d.transvalue) AS Price
           , SUM(d.transvalue) AS GrossProfit
    FROM  country AS c 
    CROSS JOIN delivery AS d 
    INNER JOIN StockInfo AS i 
	    ON i.Id = d.ItemID 
    INNER JOIN Merchandising.Location l
        ON l.SalesId = LEFT(d.acctno, 3)
    INNER JOIN NonStocks.NonStock ns
        ON i.SKU = ns.SKU
        AND ns.SKU = 'RB'
        AND ns.Active != 0
    GROUP BY CAST(d.datetrans AS DATE), 
             l.Fascia, 
             l.SalesId, 
             l.Name
UNION ALL
    SELECT CAST(f.datetrans AS DATE) AS TransactionDate
           , l.Fascia
           , l.SalesId AS LocationId
           , l.Name AS LocationName
           , SUM(f.transvalue) AS Price
           , SUM(f.transvalue) AS GrossProfit
    FROM  country AS c 
    CROSS JOIN fintrans AS f
    INNER JOIN Merchandising.Location l
        ON l.SalesId = LEFT(f.acctno, 3)
    WHERE f.transtypecode = 'BDU'
    GROUP BY CAST(f.datetrans AS DATE), 
             l.Fascia, 
             l.SalesId, 
             l.Name
)

SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) AS DateKey
                   , TransactionDate
                   , Fascia
                   , LocationId
                   , LocationName
                   , 'Rebate and BDU' AS SaleType      --BDU - Bad Debt Unearned credit
                   , 'Rebate and BDU' AS Division
                   , 'Rebate and BDU' AS Department 
                   , CAST(SUM(Price) AS DECIMAL(38, 17)) AS Price
                   , CAST(SUM(GrossProfit) AS DECIMAL(38, 17)) AS GrossProfit
            FROM Data
            INNER JOIN Merchandising.Dates AS dates
                ON CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) = dates.DateKey
            GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)),
                   TransactionDate, 
                   Fascia, 
                   LocationId, 
                   LocationName
            UNION ALL --Fascia
            SELECT CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) AS DateKey
                   , TransactionDate
                   , Fascia
                   ,f.FasciaId AS LocationId
                   , Fascia AS LocationName
                   , 'Rebate and BDU' AS SaleType      --BDU - Bad Debt Unearned credit
                   , 'Rebate and BDU' AS Division
                   , 'Rebate and BDU' AS Department 
                   , CAST(SUM(Price) AS DECIMAL(38, 17)) AS Price
                   , CAST(SUM(GrossProfit) AS DECIMAL(38, 17)) AS GrossProfit
            FROM Data d
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on d.Fascia = f.FasciaName
            INNER JOIN Merchandising.Dates AS dates
                ON CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) = dates.DateKey
            GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)),
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId
            UNION ALL --Country
            SELECT CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) AS DateKey
                   , TransactionDate
                   , 'Company' AS Fascia
                   , 0 AS LocationId
                   , 'Company' AS LocationName
                   , 'Rebate and BDU' AS SaleType      --BDU - Bad Debt Unearned credit
                   , 'Rebate and BDU' AS Division
                   , 'Rebate and BDU' AS Department 
                   , CAST(SUM(Price) AS DECIMAL(38, 17)) AS Price
                   , CAST(SUM(GrossProfit) AS DECIMAL(38, 17)) AS GrossProfit
            FROM Data
            INNER JOIN Merchandising.Dates AS dates
                ON CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)) = dates.DateKey
            GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), TransactionDate, 112)),
                   TransactionDate
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRPenaltyView]'))
    DROP VIEW [Merchandising].[WTRPenaltyView]
GO

CREATE VIEW [Merchandising].[WTRPenaltyView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, Division, SaleType, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), CASE 
                                                    WHEN DATEPART(HOUR, i.DateStart) > 7 THEN i.DateStart
                                                    ELSE DATEADD(DAY, -1, i.DateStart)
                                                END, 112)) AS DateKey,
               CAST(CASE 
                        WHEN DATEPART(HOUR, i.DateStart) > 7 THEN i.DateStart
                        ELSE DATEADD(DAY, -1, i.DateStart)
                    END AS DATE) AS TransactionDate,
               l.Fascia,
               l.SalesId AS LocationId,
               l.Name AS LocationName,
               CASE 
	               WHEN cl.AcctNo IS NOT NULL THEN 'Penalty Interest Loans'
                   WHEN a.accttype = 'T' THEN 'Penalty Interest Store Card'
	               ELSE 'Penalty Interest Credit'
	           END AS Division,
               CASE 
	               WHEN cl.AcctNo IS NOT NULL THEN 'Penalty Interest Loans'
                   WHEN a.accttype = 'T' THEN 'Penalty Interest Store Card'
	               ELSE 'Penalty Interest Credit'
	           END AS SaleType,
               SUM(f.transvalue) AS Price,
               SUM(f.transvalue) AS GrossProfit
        FROM country AS c 
        CROSS JOIN fintrans f 
        INNER JOIN Merchandising.Location l
        ON l.SalesId = LEFT(f.acctno, 3)
        INNER JOIN acct a
        ON a.acctno = f.acctno
            AND a.accttype NOT IN ('C', 'S')
        INNER JOIN InterfaceControl i
        ON i.RunNo = f.runno
            AND i.Interface = 'COS FACT'
            AND i.Result = 'P'
        INNER JOIN custacct ca
        ON f.acctno = ca.acctno
            AND ca.hldorjnt = 'H'
        LEFT OUTER JOIN CashLoan cl
        ON f.acctno = cl.AcctNo
            AND ca.custid = cl.Custid
        WHERE f.transtypecode = 'INT'
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), CASE 
                                                      WHEN DATEPART(HOUR, i.DateStart) > 7 THEN i.DateStart
                                                      ELSE DATEADD(DAY, -1, i.DateStart)
                                                  END, 112)),
                 CAST(CASE 
                          WHEN DATEPART(HOUR, i.DateStart) > 7 THEN i.DateStart
                          ELSE DATEADD(DAY, -1, i.DateStart)
                      END AS DATE),
                 l.Fascia,
                 l.SalesId, 
                 l.Name, 
                 CASE 
	                 WHEN cl.AcctNo IS NOT NULL THEN 'Penalty Interest Loans'
                     WHEN a.accttype = 'T' THEN 'Penalty Interest Store Card'
	                 ELSE 'Penalty Interest Credit'
	             END
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   Division AS Division, 
                   SaleType AS SaleType,                    
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     Division,
                     SaleType
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   Division AS Division, 
                   SaleType AS SaleType,                    
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     Division,
                     SaleType
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRLoansView]'))
    DROP VIEW [Merchandising].[WTRLoansView]
GO

CREATE VIEW [Merchandising].[WTRLoansView]
AS
    WITH ExportData (DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Department, Division, Price, GrossProfit)
    AS 
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
               , CAST(d.datetrans AS DATE) AS TransactionDate
               , loc.Fascia
               , loc.SalesId AS LocationId
               , loc.Name AS LocationName
               , 'Loan Disbursement' AS SaleType
               , 'Loan Disbursement' AS Department
               , 'Loan Disbursement' AS Division
               , SUM(d.transvalue) AS Price
               , SUM(d.transvalue) AS GrossProfit
        FROM  country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN Merchandising.Location loc
            ON loc.SalesId = d.stocklocn
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN CashLoan AS l 
	        ON l.AcctNo = d.acctno
        INNER JOIN NonStocks.NonStock ns
            ON i.SKU = ns.SKU
            AND ns.SKU = 'LOAN'
            AND ns.Active != 0
        INNER JOIN Merchandising.Dates AS dates 
            ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 loc.Fascia, 
                 loc.SalesId, 
                 loc.Name
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Department,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Department,
                     Division
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRInstallationsView]'))
    DROP VIEW [Merchandising].[WTRInstallationsView]
GO

CREATE VIEW [Merchandising].[WTRInstallationsView]
AS 
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Department, Division, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
        , CAST(d.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName
        , CASE ns.[Type] 
	        WHEN 'inst' THEN 'Installation'
	        ELSE 'Assembly'
	      END AS SaleType
        , 'Installation and Delivery' AS Department
        , 'Installation and Delivery' AS Division
        , SUM(CASE
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
	          END) AS Price
        , SUM((CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
	           END) - d.quantity * COALESCE (branchprice.CostPrice, fasciaprice.CostPrice, allprice.CostPrice, 0)
             ) AS GrossProfit
        FROM country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN branch AS b 
	        ON b.branchno = LEFT(d.acctno, 3) 
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN NonStocks.NonStock AS ns 
	        ON ns.SKU = i.SKU 
            AND ns.Type IN ('inst', 'assembly')
            AND ns.Active != 0
        LEFT OUTER JOIN NonStocks.NonStockPrice AS branchprice 
	        ON branchprice.NonStockId = ns.Id 
	        AND branchprice.BranchNumber = b.branchno 
	        AND branchprice.EffectiveDate = (SELECT MAX(EffectiveDate)
											 FROM NonStocks.NonStockPrice
											 WHERE NonStockId = branchprice.NonStockId
												AND BranchNumber = branchprice.BranchNumber
												AND EffectiveDate <= d.datetrans)
        LEFT OUTER JOIN  NonStocks.NonStockPrice AS fasciaprice 
	        ON fasciaprice.NonStockId = ns.Id 
	        AND fasciaprice.Fascia = b.StoreType
	        AND fasciaprice.BranchNumber IS NULL
            AND fasciaprice.EffectiveDate = (SELECT MAX(EffectiveDate)
											 FROM NonStocks.NonStockPrice
											 WHERE NonStockId = fasciaprice.NonStockId
												AND Fascia = fasciaprice.Fascia
	                                            AND BranchNumber IS NULL
												AND EffectiveDate <= d.datetrans)
        LEFT OUTER JOIN NonStocks.NonStockPrice AS allprice 
	        ON allprice.NonStockId = ns.Id 
	        AND allprice.Fascia IS NULL 
	        AND allprice.BranchNumber IS NULL 
	        AND allprice.EffectiveDate = (SELECT MAX(EffectiveDate)
										  FROM NonStocks.NonStockPrice
										  WHERE NonStockId = allprice.NonStockId
												AND Fascia IS NULL 
	                                            AND BranchNumber IS NULL 
												AND EffectiveDate <= d.datetrans)
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 CASE ns.[Type] 
	                WHEN 'inst' THEN 'Installation' 
	                ELSE 'Assembly' 
	             END

        UNION ALL

        SELECT CONVERT(INT, CONVERT(VARCHAR(8), COALESCE(sr.FinaliseReturnDate, sr.ResolutionDate, sr.LastUpdatedOn), 112)) AS DateKey
        , CAST(COALESCE(sr.FinaliseReturnDate, sr.ResolutionDate, sr.LastUpdatedOn) AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName
        , 'Installation' AS SaleType
        , 'Installation and Delivery' AS Department
        , 'Installation and Delivery' AS Division
        , SUM(src.Value) AS Price
        , SUM(src.Value - src.Cost) AS GrossProfit
        FROM country AS c 
        CROSS JOIN Service.Request AS sr
        INNER JOIN branch AS b 
	        ON b.branchno = LEFT(sr.Account, 3)
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN Service.Charge src
            ON sr.Id = src.RequestId
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), COALESCE(sr.FinaliseReturnDate, sr.ResolutionDate, sr.LastUpdatedOn), 112)) = dates.DateKey
        WHERE sr.[State] = 'Closed'
            AND sr.[Type] IN ('II', 'IE')
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), COALESCE(sr.FinaliseReturnDate, sr.ResolutionDate, sr.LastUpdatedOn), 112))
               , CAST(COALESCE(sr.FinaliseReturnDate, sr.ResolutionDate, sr.LastUpdatedOn) AS DATE)
               , l.Fascia
               , l.SalesId
               , l.Name
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT DateKey,
                   TransactionDate,
                   Fascia,
                   LocationId,
                   LocationName,
                   SaleType,
                   Department,
                   Division,
                   SUM(Price) AS Price,
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey,
                     TransactionDate,
                     Fascia,
                     LocationId,
                     LocationName,
                     SaleType,
                     Department,
                     Division
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] F ON e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Department,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Department,
                     Division
        ) AS data

GO


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[NonStocks].[HierarchyView]'))
    DROP VIEW [NonStocks].[HierarchyView]
GO

CREATE VIEW [NonStocks].[HierarchyView]
AS
    SELECT 
        n.id AS NonStockId,
        hl.LevelId,
        hl.[Level],
        hl.LevelName,
        n.[Type] AS NonStockType,
        n.SKU,
        n.Active,
        n.TaxRate
    FROM NonStocks.NonStock n
    LEFT OUTER JOIN (SELECT l.Id AS LevelId,
                            l.Name AS [Level],
                            h.LevelName,
                            h.NonStockId 
                     FROM Merchandising.HierarchyLevel l
                     INNER JOIN NonStocks.NonStockHierarchy h
                        ON h.[Level] = l.Id
                    ) AS hl
    ON hl.NonStockId = n.id
GO

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRIGenericServicesView]'))
    DROP VIEW [Merchandising].[WTRIGenericServicesView]
GO

CREATE VIEW [Merchandising].[WTRIGenericServicesView]
AS 
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Department, Division, DepartmentCode, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
        , CAST(d.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName
        , 'Other Generic Services' AS SaleType
        , ISNULL(department.LevelName, 'Other Generic Services') AS Department
        , ISNULL(division.LevelName, 'Other Generic Services') AS Division
        , CAST(ISNULL(department.LevelId, 0) AS VARCHAR) AS DepartmentCode
        , SUM(CASE
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
	          END) AS Price
        , SUM((CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
	           END) - d.quantity * COALESCE (branchprice.CostPrice, fasciaprice.CostPrice, allprice.CostPrice, 0)
             ) AS GrossProfit
        FROM country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN branch AS b 
	        ON b.branchno = d.branchno 
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN NonStocks.NonStock AS ns 
	        ON ns.SKU = i.SKU 
            AND ns.[Type] = 'generic'
            AND ns.Active != 0
        LEFT OUTER JOIN [NonStocks].[HierarchyView] AS department
            ON department.NonStockId = ns.Id
            AND department.[Level] = 'Department'
        LEFT OUTER JOIN [NonStocks].[HierarchyView] AS division
            ON division.NonStockId = ns.Id
            AND division.[Level] = 'Division'
        LEFT OUTER JOIN NonStocks.NonStockPrice AS branchprice 
	        ON branchprice.NonStockId = ns.Id 
	        AND branchprice.BranchNumber = b.branchno 
	        AND branchprice.EffectiveDate = (SELECT MAX(EffectiveDate) 
                                             FROM NonStocks.NonStockPrice
                                             WHERE NonStockId = branchprice.NonStockId
                                                AND BranchNumber = branchprice.BranchNumber
                                                AND EffectiveDate <= d.datetrans)
        LEFT OUTER JOIN  NonStocks.NonStockPrice AS fasciaprice 
	        ON fasciaprice.NonStockId = ns.Id 
	        AND fasciaprice.Fascia = b.StoreType 
	        AND fasciaprice.BranchNumber IS NULL 
            AND fasciaprice.EffectiveDate = (SELECT MAX(EffectiveDate) 
                                             FROM NonStocks.NonStockPrice
                                             WHERE NonStockId = fasciaprice.NonStockId
                                                AND Fascia = fasciaprice.Fascia
                                                AND BranchNumber IS NULL
                                                AND EffectiveDate <= d.datetrans)
        LEFT OUTER JOIN NonStocks.NonStockPrice AS allprice 
	        ON allprice.NonStockId = ns.Id 
	        AND allprice.Fascia IS NULL 
	        AND allprice.BranchNumber IS NULL 
	        AND allprice.EffectiveDate = (SELECT MAX(EffectiveDate) 
                                             FROM NonStocks.NonStockPrice
                                             WHERE NonStockId = allprice.NonStockId
                                                AND Fascia IS NULL
                                                AND BranchNumber IS NULL
                                                AND EffectiveDate <= d.datetrans)
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        WHERE ns.SKU NOT IN ('DT', 'RB', 'LOAN', 'STAX')
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 ISNULL(department.LevelName, 'Other Generic Services'), 
                 ISNULL(division.LevelName, 'Other Generic Services'), 
                 CAST(ISNULL(department.LevelId, 0) AS VARCHAR)
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Department,
                     Division,
                     DepartmentCode
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Department,
                     Division,
                     DepartmentCode
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTREndOfMonthStockItemsValueView]'))
    DROP VIEW [Merchandising].[WTREndOfMonthStockItemsValueView]
GO

CREATE VIEW [Merchandising].[WTREndOfMonthStockItemsValueView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, DepartmentCode, Department, ClassCode, Class, Price, GrossProfit)
    AS
    (
        SELECT svs.SnapshotDateId AS DateKey
               , CAST(CAST(svs.SnapshotDateId AS VARCHAR) AS DATE) AS TransactionDate
               , l.Fascia
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , 'Stock Value' AS SaleType
               , ISNULL(division.Tag, '(Unknown Division)') AS Division
               , ISNULL(Department.Code, '0') AS DepartmentCode
               , ISNULL(Department.Tag, '(Unknown Department)') AS Department
               , ISNULL(Class.Code, '0') AS ClassCode
               , ISNULL(Class.Tag, '(Unknown Class)') AS Class
               , SUM(svs.StockOnHandValue) AS Price
               , 0 AS GrossProfit
        FROM Merchandising.StockValuationSnapshot svs
        INNER JOIN Merchandising.Product p
            ON svs.ProductId = p.Id
        INNER JOIN Merchandising.Location l
            ON l.Id = svs.LocationId
        INNER JOIN Merchandising.Dates d
            ON svs.SnapshotDateId = d.DateKey
        LEFT OUTER JOIN Merchandising.ProductHierarchyView AS division 
	        ON division.ProductId = svs.ProductId 
	        AND division.[Level] = 'Division' 
        LEFT OUTER JOIN  Merchandising.ProductHierarchyView AS Department 
	        ON Department.ProductId = svs.ProductId
	        AND Department.[Level] = 'Department'
        LEFT OUTER JOIN MERchandising.ProductHierarchyView as Class
	        ON Class.ProductId = svs.ProductId
	        AND Class.[Level] = 'Class' 
        WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active')
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0)
        GROUP BY svs.SnapshotDateId, 
                 CAST(CAST(svs.SnapshotDateId AS VARCHAR) AS DATE), 
                 l.Fascia,
                 l.SalesId, 
                 l.Name,
                 ISNULL(division.Tag, '(Unknown Division)'), 
                 ISNULL(Department.Code, '0'), 
                 ISNULL(Department.Tag, '(Unknown Department)'),
                 ISNULL(Class.Code, '0'), 
                 ISNULL(Class.Tag, '(Unknown Class)')
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department,
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department,
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTREndOfMonthStockItemsValueBranchView]'))
    DROP VIEW [Merchandising].[WTREndOfMonthStockItemsValueBranchView]
GO

CREATE VIEW [Merchandising].[WTREndOfMonthStockItemsValueBranchView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, Price, GrossProfit)
    AS
    (
        SELECT svs.SnapshotDateId AS DateKey
               , CAST(CAST(svs.SnapshotDateId AS VARCHAR) AS DATE) AS TransactionDate
               , l.Fascia
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , 'Company Stock Value' AS SaleType
               , 'Branch' AS Division
               , SUM(svs.StockOnHandValue) AS Price
               , 0 AS GrossProfit
        FROM  Merchandising.StockValuationSnapshot svs
        INNER JOIN Merchandising.Location l
            ON l.Id = svs.LocationId
        INNER JOIN Merchandising.Dates d
            ON d.DateKey = svs.SnapshotDateId
        INNER JOIN Merchandising.Product p
            ON svs.ProductId = p.Id
        WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active') 
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0)
        GROUP BY svs.SnapshotDateId, CAST(CAST(svs.SnapshotDateId AS VARCHAR) AS DATE), 
                 l.Fascia,
                 l.SalesId, 
                 l.Name
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType,    
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[NonStocks].[HierarchyView]'))
    DROP VIEW [NonStocks].[HierarchyView]
GO

CREATE VIEW [NonStocks].[HierarchyView]
AS
    SELECT 
        n.id AS NonStockId,
        hl.LevelId,
        hl.[Level],
        hl.LevelName,
        n.[Type] AS NonStockType,
        n.SKU,
        n.Active,
        n.TaxRate
    FROM NonStocks.NonStock n
    LEFT OUTER JOIN (SELECT l.Id AS LevelId,
                            l.Name AS [Level],
                            h.LevelName,
                            h.NonStockId 
                     FROM Merchandising.HierarchyLevel l
                     INNER JOIN NonStocks.NonStockHierarchy h
                        ON h.[Level] = l.Id
                    ) AS hl
    ON hl.NonStockId = n.id
GO

IF EXISTS(SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRDiscountsView]'))
    DROP VIEW [Merchandising].[WTRDiscountsView]
GO

CREATE VIEW [Merchandising].[WTRDiscountsView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, Department, DepartmentCode, Price, GrossProfit)
    AS 
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
        , CAST(d.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName 
        , CASE 
            WHEN a.accttype IN ('C', 'S') THEN 'Discounts Cash'
            ELSE 'Discounts Credit'
          END AS SaleType
        , ISNULL(division.LevelName ,'Discounts') AS Division
        , ISNULL(department.LevelName ,'Discounts') AS Department
        , CAST(ISNULL(department.LevelId, 0) AS VARCHAR) AS DepartmentCode
        , SUM(CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
              END) AS Price
        , SUM((CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue END) - d.quantity * COALESCE (branchprice.CostPrice, fasciaprice.CostPrice, allprice.CostPrice, 0) 
             )AS GrossProfit
        FROM country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN branch AS b 
	        ON b.branchno = LEFT(d.acctno, 3) 
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN acct a
            ON a.acctno = d.acctno
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN NonStocks.NonStock ns
            ON ns.SKU = i.SKU
            AND ns.[Type] = 'discount'
            AND ns.Active != 0
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        LEFT OUTER JOIN NonStocks.HierarchyView department
	        ON department.NonStockId = ns.Id
            AND department.[Level] = 'Department'        
        LEFT OUTER JOIN NonStocks.HierarchyView division
	        ON division.NonStockId = ns.Id
            AND division.[Level] = 'Division'
        LEFT OUTER JOIN NonStocks.NonStockPrice AS branchprice 
	        ON branchprice.NonStockId = ns.Id 
	        AND branchprice.BranchNumber = b.branchno 
	        AND branchprice.EffectiveDate <= d.datetrans 
        LEFT OUTER JOIN  NonStocks.NonStockPrice AS fasciaprice 
	        ON fasciaprice.NonStockId = ns.Id 
	        AND fasciaprice.Fascia = b.StoreType 
	        AND fasciaprice.EffectiveDate <= d.datetrans 
	        AND fasciaprice.BranchNumber IS NULL 
        LEFT OUTER JOIN NonStocks.NonStockPrice AS allprice 
	        ON allprice.NonStockId = ns.Id 
	        AND allprice.Fascia IS NULL 
	        AND allprice.BranchNumber IS NULL 
	        AND allprice.EffectiveDate <= d.datetrans 
        WHERE (
			        branchprice.EffectiveDate IS NULL 
			        OR branchprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = branchprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
		        ) 
	        AND (
			        fasciaprice.EffectiveDate IS NULL 
			        OR fasciaprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = fasciaprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
		        ) 
	        AND (
			        allprice.EffectiveDate IS NULL 
			        OR allprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = allprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
    		    ) 
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 ISNULL(division.LevelName ,'Discounts'), 
                 ISNULL(department.LevelName ,'Discounts'), 
                 CAST(ISNULL(department.LevelId, 0) AS VARCHAR), 
                 CASE 
                     WHEN a.accttype IN ('C', 'S') THEN 'Discounts Cash'
                     ELSE 'Discounts Credit'
                 END

        UNION ALL

        SELECT CONVERT(INT, CONVERT(VARCHAR(8), f.datetrans, 112)) AS DateKey
        , CAST(f.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName 
        , CASE 
            WHEN  f.transtypecode = 'DDC' THEN 'Discounts Cash'
            ELSE 'Discounts Credit'
          END AS SaleType
        , 'Discounts' AS Division
        , 'Discounts' AS Department
        , '0' AS DepartmentCode
        , SUM(f.transvalue) AS Price
        , 0 GrossProfit
        FROM country AS c 
        CROSS JOIN fintrans AS f 
        INNER JOIN Merchandising.Location l
            ON l.SalesId = LEFT(f.acctno, 3)
        INNER JOIN acct a
            ON a.acctno = f.acctno
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), f.datetrans, 112)) = dates.DateKey
        WHERE f.transtypecode IN ('DDH', 'DDC')
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), f.datetrans, 112)),
                 CAST(f.datetrans AS DATE),
                 l.Fascia,
                 l.SalesId,
                 l.Name,
                 CASE 
                    WHEN  f.transtypecode = 'DDC' THEN 'Discounts Cash'
                    ELSE 'Discounts Credit'
                 END
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   Department AS Department, 
                   DepartmentCode AS DepartmentCode, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType, 
                     Division, 
                     Department, 
                     DepartmentCode
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   Department AS Department, 
                   DepartmentCode AS DepartmentCode, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division,
                     Department,
                     DepartmentCode
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRCurrentStockItemsValueView]'))
    DROP VIEW [Merchandising].[WTRCurrentStockItemsValueView]
GO

CREATE VIEW [Merchandising].[WTRCurrentStockItemsValueView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, DepartmentCode, Department, ClassCode, Class, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), GETDATE(), 112)) AS DateKey
               , CAST(GETDATE() AS DATE) AS TransactionDate
               , l.Fascia
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , 'Stock Value' AS SaleType
               , ISNULL(division.Tag, '(Unknown Division)') AS Division
               , ISNULL(Department.Code, '0') AS DepartmentCode
               , ISNULL(Department.Tag, '(Unknown Department)') AS Department
               , ISNULL(Class.Code, '0') AS ClassCode
               , ISNULL(Class.Tag, '(Unknown Class)') AS Class
               , SUM(ISNULL(stLevel.StockOnHand, 0) * ISNULL(curCost.AverageWeightedCost, 0)) AS Price
               , 0 AS GrossProfit
        FROM Merchandising.ProductStockLevel stLevel
        INNER JOIN Merchandising.CurrentCostPriceView curCost
            ON stLevel.ProductId = curCost.ProductId
        INNER JOIN Merchandising.Location l
            ON l.Id = stLevel.LocationId
        INNER JOIN Merchandising.Product p
            ON stLevel.ProductId = p.Id
        LEFT OUTER JOIN Merchandising.ProductHierarchyView AS division 
	        ON division.ProductId = stLevel.ProductId 
	        AND division.[Level] = 'Division' 
        LEFT OUTER JOIN  Merchandising.ProductHierarchyView AS Department 
	        ON Department.ProductId = stLevel.ProductId
	        AND Department.[Level] = 'Department'
        LEFT OUTER JOIN MERchandising.ProductHierarchyView as Class
	        on Class.ProductId = stLevel.ProductId
	        and Class.[Level] = 'Class'
        WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active') 
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0)
        GROUP BY l.Fascia,
                 l.SalesId, 
                 l.Name, 
                 ISNULL(division.Tag, '(Unknown Division)'), 
                 ISNULL(Department.Code, '0'),
                 ISNULL(Department.Tag, '(Unknown Department)'), 
                 ISNULL(Class.Code, '0'), 
                 ISNULL(Class.Tag, '(Unknown Class)')
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department,
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department,
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRCurrentStockItemsValueBranchView]'))
    DROP VIEW [Merchandising].[WTRCurrentStockItemsValueBranchView]
GO

CREATE VIEW [Merchandising].[WTRCurrentStockItemsValueBranchView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), GETDATE(), 112)) AS DateKey
               , CAST(GETDATE() AS DATE) AS TransactionDate
               , l.Fascia
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , 'Company Stock Value' AS SaleType
               , 'Branch' AS Division
               , SUM(stLevel.StockOnHand * curCost.AverageWeightedCost) AS Price
               , 0 AS GrossProfit
        FROM  Merchandising.ProductStockLevel stLevel
        INNER JOIN Merchandising.CurrentCostPriceView curCost
            ON stLevel.ProductId = curCost.ProductId
        INNER JOIN Merchandising.Location l
            ON l.Id = stLevel.LocationId
        INNER JOIN Merchandising.Product p
            ON curCost.ProductId = p.Id
        WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active')
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0)
        GROUP BY l.Fascia, l.SalesId, l.Name
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType,                    
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType,    
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRCreditCashDifferenceView]'))
    DROP VIEW [Merchandising].[WTRCreditCashDifferenceView]
GO

CREATE VIEW [Merchandising].[WTRCreditCashDifferenceView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, DepartmentCode, Department, ClassCode, Class, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) AS DateKey
               , CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE) AS TransactionDate
               , l.Fascia
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , 'Credit/Cash Difference' AS SaleType
               , ISNULL(division.Tag, '(Unknown Division)') AS Division
               , ISNULL(Department.Code, '0') AS DepartmentCode
               , ISNULL(Department.Tag, '(Unknown Department)') AS Department
               , ISNULL(Class.Code, '0') AS ClassCode
               , ISNULL(Class.Tag, '(Unknown Class)') AS Class
		       , SUM((coc.Price - coc.CashPrice) * coc.Quantity) AS Price
		       , SUM((coc.Price - coc.CashPrice) * coc.Quantity) AS GrossProfit
        FROM  Merchandising.CintOrderCostView AS coc
        INNER JOIN  Merchandising.Product AS p 
	        ON coc.Sku = p.SKU 
	        AND coc.[Type] IN ('Return', 'Delivery', 'Redelivery', 'Repossession') 
        INNER JOIN Merchandising.Location l
            ON l.Id = coc.SalesLocationId
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) = dates.DateKey 
        LEFT OUTER JOIN Merchandising.ProductHierarchyView AS division 
	        ON division.ProductId = p.Id 
	        AND division.[Level] = 'Division' 
        LEFT OUTER JOIN  Merchandising.ProductHierarchyView AS Department 
	        ON Department.ProductId = p.Id 
	        AND Department.[Level] = 'Department'
        LEFT OUTER JOIN MERchandising.ProductHierarchyView as Class
	        ON Class.ProductId = p.Id
	        AND Class.[Level] = 'Class' 
        WHERE coc.SaleType = 'Credit'
            AND p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active')
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0) 
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)), 
                 CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE), 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 ISNULL(division.Tag, '(Unknown Division)'), 
                 ISNULL(Department.Code, '0'), 
                 ISNULL(Department.Tag, '(Unknown Department)'), 
                 ISNULL(Class.Code, '0'), 
                 ISNULL(Class.Tag, '(Unknown Class)')
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department, 
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode,
                   Department AS Department, 
                   ClassCode AS ClassCode,
                   Class AS Class,
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division,
                     DepartmentCode,
                     Department,
                     ClassCode,
                     Class
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS(SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRAffinityView]'))
    DROP VIEW [Merchandising].[WTRAffinityView]
GO

CREATE VIEW [Merchandising].[WTRAffinityView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Department, Division, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
        , CAST(d.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName 
        , CASE ns.[Type]
            WHEN 'rassist' THEN 'Ready Assist' 
            ELSE 'Other Annual'
          END AS SaleType
        , 'Affinity' AS Department
        , 'Affinity' AS Division
        , SUM(CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue 
              END) AS Price
        , SUM((CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ns.taxrate / 100) 
	            ELSE d .transvalue END) - d.quantity * COALESCE (branchprice.CostPrice, fasciaprice.CostPrice, allprice.CostPrice) 
             )AS GrossProfit
        FROM country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN branch AS b 
	        ON b.branchno = d.branchno 
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN NonStocks.NonStock AS ns 
	        ON ns.SKU = i.SKU 
            AND ns.[Type] IN ('rassist', 'annual')
            AND ns.Active != 0
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        LEFT OUTER JOIN NonStocks.NonStockPrice AS branchprice 
	        ON branchprice.NonStockId = ns.Id 
	        AND branchprice.BranchNumber = b.branchno 
	        AND branchprice.EffectiveDate <= d.datetrans 
        LEFT OUTER JOIN  NonStocks.NonStockPrice AS fasciaprice 
	        ON fasciaprice.NonStockId = ns.Id 
	        AND fasciaprice.Fascia = b.StoreType 
	        AND fasciaprice.EffectiveDate <= d.datetrans 
	        AND fasciaprice.BranchNumber IS NULL 
        LEFT OUTER JOIN NonStocks.NonStockPrice AS allprice 
	        ON allprice.NonStockId = ns.Id 
	        AND allprice.Fascia IS NULL 
	        AND allprice.BranchNumber IS NULL 
	        AND allprice.EffectiveDate <= d.datetrans 
        WHERE (
			        branchprice.EffectiveDate IS NULL 
			        OR branchprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = branchprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
		        ) 
	        AND (
			        fasciaprice.EffectiveDate IS NULL 
			        OR fasciaprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = fasciaprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
		        ) 
	        AND (
			        allprice.EffectiveDate IS NULL 
			        OR allprice.EffectiveDate IN
				        (
					        SELECT MAX(EffectiveDate) AS Expr1
					        FROM NonStocks.NonStockPrice AS m
					        WHERE (Id = allprice.Id) 
					        AND (EffectiveDate <= d.datetrans)
				        )
    		    ) 
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 CASE ns.[Type]
                    WHEN 'rassist' THEN 'Ready Assist' 
                    ELSE 'Other Annual'
                 END
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Department,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Department,
                     Division
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRWarrantyReturnsView]'))
    DROP VIEW [Merchandising].[WTRWarrantyReturnsView]
GO

CREATE VIEW [Merchandising].[WTRWarrantyReturnsView]
AS

    SELECT d.contractno AS WarrantyContractNumber,
           w.Number AS WarrantyNumber,
           CAST(d.datetrans AS DATE) AS ReturnDate,
           d.delorcoll AS CollectOrRepossession,
           CASE 
	        WHEN SUBSTRING(d.acctno, 4, 1) = '5' THEN 'Cash'
	        WHEN SUBSTRING(d.acctno, 4, 1) = '4' THEN 'Cash'
	        ELSE 'Credit'
	      END AS SaleType
    FROM delivery AS d 
    INNER JOIN StockInfo AS i 
	    ON i.Id = d.ItemID 
    INNER JOIN Warranty.Warranty AS w 
	    ON w.Number = COALESCE(i.SKU, i.itemno, i.IUPC)
    WHERE d.delorcoll != 'D'
        AND w.TypeCode = 'E'

GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRWarrantyReturnValuesView]'))
    DROP VIEW [Merchandising].[WTRWarrantyReturnValuesView]
GO

CREATE VIEW [Merchandising].[WTRWarrantyReturnValuesView]
AS

    SELECT wr.WarrantyNumber,
           wr.WarrantyContractNumber, 
           wm.Department, 
           wm.BranchNo, 
           wm.SalePrice AS OriginalSalePrice, 
           wm.CostPrice AS OriginalCostPrice, 
           wm.PercentageReturn, 
           CASE 
	           WHEN (SELECT ISNULL(c.ValueBit, 0) FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising') = 0 
		           THEN wm.SalePrice
	           ELSE (wm.SalePrice * 100)/(100 + wm.TaxRate)
           END AS SalePrice,
           wm.CostPrice AS CostPrice,
           CASE 
	           WHEN (SELECT ISNULL(c.ValueBit, 0) FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising') = 0 
		           THEN wm.SalePrice - (wm.PercentageReturn * wm.SalePrice / 100)
	           ELSE (wm.SalePrice * (100 - wm.PercentageReturn) / (100 + wm.TaxRate))
           END AS ReturnValue,
		   wm.CostPrice - (wm.PercentageReturn * wm.CostPrice / 100) AS ReturnCost,
           wr.ReturnDate AS ReturnDate,
           wr.SaleType
    FROM Financial.WarrantyReturnView wm
    INNER JOIN Merchandising.WTRWarrantyReturnsView wr
    ON wr.WarrantyContractNumber = wm.ContractNumber
    WHERE wm.[Level] = (SELECT MAX([Level]) FROM Financial.WarrantyReturnView wm2 WHERE wm.Id = wm2.Id)
        AND wm.ElapsedMonths = CASE
								    WHEN dbo.FullMonthsDiff(wm.DeliveredOn, wr.ReturnDate) < 1 THEN 1
								    ELSE dbo.FullMonthsDiff(wm.DeliveredOn, wr.ReturnDate)
							    END  
        AND NOT EXISTS (SELECT 'A' FROM IgnoreCRECRF WHERE ContractNo = wm.ContractNumber)

GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRWarrantyReturnsView]'))
    DROP VIEW [Merchandising].[WTRWarrantyReturnsView]
GO

CREATE VIEW [Merchandising].[WTRWarrantyReturnsView]
AS

    SELECT d.contractno AS WarrantyContractNumber,
           w.Number AS WarrantyNumber,
           CAST(d.datetrans AS DATE) AS ReturnDate,
           d.delorcoll AS CollectOrRepossession,
           CASE 
	        WHEN SUBSTRING(d.acctno, 4, 1) = '5' THEN 'Cash'
	        WHEN SUBSTRING(d.acctno, 4, 1) = '4' THEN 'Cash'
	        ELSE 'Credit'
	      END AS SaleType
    FROM delivery AS d 
    INNER JOIN StockInfo AS i 
	    ON i.Id = d.ItemID 
    INNER JOIN Warranty.Warranty AS w 
	    ON w.Number = COALESCE(i.SKU, i.itemno, i.IUPC)
    WHERE d.delorcoll != 'D'
        AND w.TypeCode = 'E'

GO






IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRWarrantyReturnValuesView]'))
    DROP VIEW [Merchandising].[WTRWarrantyReturnValuesView]
GO

CREATE VIEW [Merchandising].[WTRWarrantyReturnValuesView]
AS

    SELECT wr.WarrantyNumber,
           wr.WarrantyContractNumber, 
           wm.Department, 
           wm.BranchNo, 
           wm.SalePrice AS OriginalSalePrice, 
           wm.CostPrice AS OriginalCostPrice, 
           wm.PercentageReturn, 
           CASE 
	           WHEN (SELECT ISNULL(c.ValueBit, 0) FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising') = 0 
		           THEN wm.SalePrice
	           ELSE (wm.SalePrice * 100)/(100 + wm.TaxRate)
           END AS SalePrice,
           wm.CostPrice AS CostPrice,
           CASE 
	           WHEN (SELECT ISNULL(c.ValueBit, 0) FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising') = 0 
		           THEN wm.SalePrice - (wm.PercentageReturn * wm.SalePrice / 100)
	           ELSE (wm.SalePrice * (100 - wm.PercentageReturn) / (100 + wm.TaxRate))
           END AS ReturnValue,
		   wm.CostPrice - (wm.PercentageReturn * wm.CostPrice / 100) AS ReturnCost,
           wr.ReturnDate AS ReturnDate,
           wr.SaleType
    FROM Financial.WarrantyReturnView wm
    INNER JOIN Merchandising.WTRWarrantyReturnsView wr
    ON wr.WarrantyContractNumber = wm.ContractNumber
    WHERE wm.[Level] = (SELECT MAX([Level]) FROM Financial.WarrantyReturnView wm2 WHERE wm.Id = wm2.Id)
        AND wm.ElapsedMonths = CASE
								    WHEN dbo.FullMonthsDiff(wm.DeliveredOn, wr.ReturnDate) < 1 THEN 1
								    ELSE dbo.FullMonthsDiff(wm.DeliveredOn, wr.ReturnDate)
							    END  
        AND NOT EXISTS (SELECT 'A' FROM IgnoreCRECRF WHERE ContractNo = wm.ContractNumber)

GO






IF EXISTS(SELECT * FROM sys.views where object_id = OBJECT_ID(N'[Merchandising].[WTRWarrantyView]'))
    DROP VIEW [Merchandising].[WTRWarrantyView]
GO

CREATE VIEW [Merchandising].[WTRWarrantyView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
        , CAST(d.datetrans AS DATE) AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName
        , CASE 
	        WHEN SUBSTRING(d.acctno, 4, 1) = '5' THEN 'Cash'
	        WHEN SUBSTRING(d.acctno, 4, 1) = '4' THEN 'Cash'
	        ELSE 'Credit'
	      END AS SaleType
        , ISNULL(t.Name, 'Warranty') AS Division
        , SUM(CASE
	              WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	              THEN d .transvalue / (1 + ISNULL(w.taxrate, 0) / 100) 
	              ELSE d .transvalue 
	          END) AS Price
        , SUM((CASE 
	            WHEN c.agrmttaxtype = 'I' AND c.taxtype = 'I' 
	            THEN d .transvalue / (1 + ISNULL(w.taxrate, 0) / 100) 
	            ELSE d .transvalue 
	           END) - d.quantity * ISNULL(wm.CostPrice, 0)
               ) AS GrossProfit
        FROM country c
        CROSS JOIN delivery AS d 
        INNER JOIN branch AS b 
	        ON b.branchno = LEFT(d.acctno, 3)
        INNER JOIN Merchandising.Location l
            ON l.SalesId = b.branchno
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN Warranty.Warranty AS w 
	        ON w.Number = COALESCE(i.SKU, i.itemno, i.IUPC)
        INNER JOIN Merchandising.Dates AS dates 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        LEFT OUTER JOIN Financial.WarrantyMessage wm
            ON wm.ContractNumber = d.contractno
        LEFT OUTER JOIN warranty.WarrantyTags wt 
	        ON wt.warrantyId = w.Id
	        AND wt.LevelId = 
		        (
			        SELECT MIN(id) 
			        FROM warranty.[level]
		        )
        LEFT OUTER JOIN warranty.Tag t 
	        ON t.Id = wt.TagId
        WHERE d.delorcoll = 'D'
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 Fascia, 
                 l.SalesId, 
                 l.Name, 
                 ISNULL(t.Name, 'Warranty'), 
                 CASE 
	                WHEN SUBSTRING(d.acctno, 4, 1) = '5' THEN 'Cash'
	                WHEN SUBSTRING(d.acctno, 4, 1) = '4' THEN 'Cash'
	                ELSE 'Credit'
	             END

        UNION ALL

        SELECT CONVERT(INT, CONVERT(VARCHAR(8), wr.ReturnDate, 112)) AS DateKey
        , wr.ReturnDate AS TransactionDate
        , l.Fascia
        , l.SalesId AS LocationId
        , l.Name AS LocationName
        , wr.SaleType
        , CASE 
            WHEN wr.Department = 'PCE' THEN 'Electrical'
            ELSE 'Furniture'
          END AS Division
        , SUM(-wr.SalePrice + wr.ReturnValue) AS Price
        , SUM(-(wr.SalePrice - wr.CostPrice) + (wr.ReturnValue - wr.ReturnCost)) AS GrossProfit
        FROM [Merchandising].[WTRWarrantyReturnValuesView] wr
        INNER JOIN Merchandising.Location l
            ON l.SalesId = wr.BranchNo
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), wr.ReturnDate, 112)),
                 wr.ReturnDate, 
                 l.Fascia, 
                 l.SalesId, 
                 l.Name, 
                 wr.SaleType, 
                 CASE 
                    WHEN wr.Department = 'PCE' THEN 'Electrical'
                    ELSE 'Furniture'
                 END
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType,
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] F ON e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType,
                   Division AS Division,  
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division
        ) AS data

GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRServiceChargeView]'))
    DROP VIEW [Merchandising].[WTRServiceChargeView]
GO    

CREATE VIEW [Merchandising].[WTRServiceChargeView]
AS
    WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Department, Division, Price, GrossProfit)
    AS
    (    
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) AS DateKey
               , CAST(d.datetrans AS DATE) AS TransactionDate
               , loc.Fascia
               , loc.SalesId AS LocationId
               , loc.Name AS LocationName
               , CASE 
                    WHEN l.AcctNo IS NOT NULL THEN 'Loan Service Charge' 
                    ELSE 'Credit Service Charge' 
                 END AS SaleType 
               , CASE 
                    WHEN l.AcctNo IS NOT NULL THEN 'Loan Service Charge' 
                    ELSE 'Credit Service Charge' 
                 END AS Department
               , CASE 
                    WHEN l.AcctNo IS NOT NULL THEN 'Loan Service Charge' 
                    ELSE 'Credit Service Charge' 
                 END AS Division 
               , SUM(d.transvalue) AS Price
               , SUM(d.transvalue) AS GrossProfit
        FROM  country AS c 
        CROSS JOIN delivery AS d 
        INNER JOIN custacct AS ca 
	        ON ca.acctno = d.acctno 
	        AND ca.hldorjnt = 'H' 
        INNER JOIN Merchandising.Location loc
            ON loc.SalesId = d.stocklocn
        INNER JOIN StockInfo AS i 
	        ON i.Id = d.ItemID 
        INNER JOIN NonStocks.NonStock ns
            ON ns.SKU = i.SKU
            AND ns.Active != 0
        INNER JOIN Merchandising.Dates AS dates 
            ON CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)) = dates.DateKey
        LEFT OUTER JOIN CashLoan AS l 
	        ON l.AcctNo = d.acctno AND ca.custid = l.Custid 
        WHERE i.SKU = 'DT'
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), d.datetrans, 112)), 
                 CAST(d.datetrans AS DATE), 
                 loc.Fascia, 
                 loc.SalesId, 
                 loc.Name, 
                 CASE 
                    WHEN l.AcctNo IS NOT NULL THEN 'Loan Service Charge' 
                    ELSE 'Credit Service Charge' 
                 END
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   Fascia, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e 
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     Fascia, 
                     f.FasciaId,
                     SaleType,
                     Department,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   SaleType AS SaleType, 
                   Department AS Department, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Department,
                     Division
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRSalesAView]'))
    DROP VIEW [Merchandising].[WTRSalesAView]
GO

CREATE VIEW [Merchandising].[WTRSalesAView]
AS
  WITH ExportData(DateKey, TransactionDate, Fascia, LocationId, LocationName, SaleType, Division, DepartmentCode, Department, ClassCode, Class, Price, GrossProfit)
  AS
  (
      SELECT
        CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) AS DateKey,
        CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE) AS TransactionDate,
        l.Fascia,
        f.FasciaId AS LocationId,
        l.Fascia AS LocationName,
        'Product Sales' AS SaleType,
        ISNULL(Division.Tag, '(Unknown Division)') AS Division,
        ISNULL(Department.Code, '0') AS DepartmentCode,
        ISNULL(Department.Tag, '(Unknown Department)') AS Department,
        ISNULL(Class.Code, '0') AS ClassCode,
        ISNULL(Class.Tag, '(Unknown Class)') AS Class,
        SUM(ISNULL(coc.CashPrice * coc.Quantity, 0)) AS Price,
        SUM(
          ISNULL(
            (
                (coc.CashPrice - ISNULL(coc.AverageWeightedCost, 0))
                - 
                (ISNULL(coc.AverageWeightedCost, 0) * COALESCE(Class.FirstYearWarrantyProvision, Department.FirstYearWarrantyProvision, Division.FirstYearWarrantyProvision, 0))
            )
            * coc.Quantity, 0)) AS GrossProfit
      FROM Merchandising.CintOrderCostView AS coc
      INNER JOIN Merchandising.Location l
        ON l.Id = coc.SalesLocationId
      INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on l.Fascia = f.FasciaName
      INNER JOIN Merchandising.Product AS p
        ON coc.Sku = p.SKU
        AND coc.[Type] IN ('Return', 'Delivery', 'Redelivery', 'Repossession')
      LEFT JOIN Merchandising.ProductHierarchyView AS Division
        ON Division.ProductId = p.Id
        AND Division.[Level] = 'Division'
      LEFT JOIN Merchandising.ProductHierarchyView AS Department
        ON Department.ProductId = p.Id
        AND Department.[Level] = 'Department'
      LEFT JOIN Merchandising.ProductHierarchyView as Class
        ON Class.ProductId = p.Id
        AND Class.[Level] = 'Class'
      INNER JOIN Merchandising.Dates AS d
        ON CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) = d.DateKey
      WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active') 
        AND p.Id NOT IN (SELECT DISTINCT p.Id
                         FROM Merchandising.Product p
                         INNER JOIN Merchandising.ProductStockLevel psl
                         ON p.Id = psl.ProductId
                         INNER JOIN Merchandising.ProductStatus ps
                         ON p.[Status] = ps.Id
                         WHERE ps.Name = 'Deleted'
                             AND psl.StockOnHand = 0
                             AND psl.StockOnOrder = 0
                             AND psl.StockAvailable = 0)
      GROUP BY
        CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)),
        CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE),
        l.Fascia,
        f.FasciaId,
        ISNULL(Division.Tag, '(Unknown Division)'),
        ISNULL(Department.Code, '0'),
        ISNULL(Department.Tag, '(Unknown Department)'),
        ISNULL(Class.Code, '0'),
        ISNULL(Class.Tag, '(Unknown Class)')
    )
    

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id, 
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL
            SELECT DateKey, 
                   TransactionDate, 
                   'Company' AS Fascia, 
                   0 AS LocationId, 
                   'Company' AS LocationName,
                   SaleType, 
                   Division, 
                   DepartmentCode, 
                   Department, 
                   ClassCode, 
                   Class, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate, 
                     SaleType, 
                     Division, 
                     DepartmentCode, 
                     Department, 
                     ClassCode, 
                     Class
         ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRSalesBView]'))
    DROP VIEW [Merchandising].[WTRSalesBView]
GO

CREATE VIEW [Merchandising].[WTRSalesBView]
AS

WITH ExportData (DateKey, TransactionDate, LocationId, LocationName, Fascia, SaleType, Division, DepartmentCode, Department, ClassCode, Class, Price, GrossProfit)
AS
(
    SELECT CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) AS DateKey
           , CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE) AS TransactionDate
           , l.SalesId AS LocationId
           , l.Name AS LocationName
           , l.Fascia
           , 'Product Sales' AS SaleType
           , ISNULL(division.Tag, '(Unknown Division)') AS Division
           , ISNULL(Department.Code, '0') AS DepartmentCode
           , ISNULL(Department.Tag, '(Unknown Department)') AS Department
           , ISNULL(Class.Code, '0') AS ClassCode
           , ISNULL(Class.Tag, '(Unknown Class)') AS Class
           , SUM(coc.CashPrice * coc.Quantity) AS Price
           , SUM(ISNULL(
                    (
                        (coc.CashPrice - ISNULL(coc.AverageWeightedCost, 0))
                        - 
                        (ISNULL(coc.AverageWeightedCost, 0) * COALESCE(Class.FirstYearWarrantyProvision, Department.FirstYearWarrantyProvision, division.FirstYearWarrantyProvision, 0))
                    ) 
                    * coc.Quantity, 0)) AS GrossProfit
    FROM  Merchandising.CintOrderCostView AS coc 
    INNER JOIN Merchandising.Location l
        ON l.Id = coc.SalesLocationId
    INNER JOIN Merchandising.Product AS p 
	    ON coc.Sku = p.SKU 
	    AND coc.[Type] IN ('Return', 'Delivery', 'Redelivery', 'Repossession') 
    LEFT OUTER JOIN Merchandising.ProductHierarchyView AS division 
	    ON division.ProductId = p.Id 
	    AND division.[Level] = 'Division' 
    LEFT OUTER JOIN  Merchandising.ProductHierarchyView AS Department 
	    ON Department.ProductId = p.Id 
	    AND Department.[Level] = 'Department'
    LEFT OUTER JOIN MERchandising.ProductHierarchyView as Class
	    on Class.ProductId = p.Id
	    and Class.[Level] = 'Class' 
    INNER JOIN Merchandising.Dates AS d 
	    ON CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) = d.DateKey
    WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active') 
        AND p.Id NOT IN (SELECT DISTINCT p.Id
                         FROM Merchandising.Product p
                         INNER JOIN Merchandising.ProductStockLevel psl
                         ON p.Id = psl.ProductId
                         INNER JOIN Merchandising.ProductStatus ps
                         ON p.[Status] = ps.Id
                         WHERE ps.Name = 'Deleted'
                             AND psl.StockOnHand = 0
                             AND psl.StockOnOrder = 0
                             AND psl.StockAvailable = 0)
    GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112))
             , CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE)
             , l.SalesId
             , l.Name
             , l.Fascia
             , ISNULL(division.Tag, '(Unknown Division)')
             , ISNULL(Department.Code, '0')
             , ISNULL(Department.Tag, '(Unknown Department)')
             , ISNULL(Class.Code, '0')
             , ISNULL(Class.Tag, '(Unknown Class)')
)

SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate,
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   Fascia AS Fascia, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode, 
                   Department AS Department, 
                   ClassCode AS ClassCode, 
                   Class AS Class, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     f.FasciaId,
                     Fascia,
                     SaleType,
                     Division, 
                     DepartmentCode, 
                     Department, 
                     ClassCode, 
                     Class
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   0 AS LocationId,
                   'Company' AS LocationName,
                   'Company' AS Fascia, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   DepartmentCode AS DepartmentCode, 
                   Department AS Department, 
                   ClassCode AS ClassCode, 
                   Class AS Class, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division, 
                     DepartmentCode, 
                     Department, 
                     ClassCode, 
                     Class
        ) AS data
GO

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

IF EXISTS (SELECT 'a' FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WTRSalesFView]'))
    DROP VIEW [Merchandising].[WTRSalesFView]
GO

CREATE VIEW [Merchandising].[WTRSalesFView]
AS
    WITH ExportData(DateKey, TransactionDate, LocationId, LocationName, Fascia, SaleType, Division, Price, GrossProfit)
    AS
    (
        SELECT CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) AS DateKey
               , CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE) AS TransactionDate
               , l.SalesId AS LocationId
               , l.Name AS LocationName
               , l.Fascia
               , coc.SaleType
               , ISNULL(division.Tag, '(Unknown Division)') AS Division
               , SUM(coc.CashPrice * coc.Quantity) AS Price
               , SUM(ISNULL(
                        (
                            (coc.CashPrice - ISNULL(coc.AverageWeightedCost, 0))
                            - 
                            (ISNULL(coc.AverageWeightedCost, 0) * COALESCE(Class.FirstYearWarrantyProvision, Department.FirstYearWarrantyProvision, division.FirstYearWarrantyProvision, 0))
                        ) 
                        * coc.Quantity, 0))AS GrossProfit
        FROM  Merchandising.CintOrderCostView AS coc 
        INNER JOIN Merchandising.Location l
            ON l.Id = coc.SalesLocationId
        INNER JOIN Merchandising.Product AS p 
	        ON coc.Sku = p.SKU 
	        AND coc.[Type] IN ('Return', 'Delivery', 'Redelivery', 'Repossession') 
        LEFT OUTER JOIN Merchandising.ProductHierarchyView AS division 
	        ON division.ProductId = p.Id 
	        AND division.[Level] = 'Division' 
        LEFT OUTER JOIN  Merchandising.ProductHierarchyView AS Department 
	        ON Department.ProductId = p.Id 
	        AND Department.[Level] = 'Department'
        LEFT OUTER JOIN MERchandising.ProductHierarchyView as Class
	        on Class.ProductId = p.Id
	        and Class.[Level] = 'Class' 
        INNER JOIN Merchandising.Dates AS d 
	        ON CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112)) = d.DateKey
        WHERE p.[Status] != (SELECT Id FROM Merchandising.ProductStatus where Name = 'Non Active') 
            AND p.Id NOT IN (SELECT DISTINCT p.Id
                             FROM Merchandising.Product p
                             INNER JOIN Merchandising.ProductStockLevel psl
                             ON p.Id = psl.ProductId
                             INNER JOIN Merchandising.ProductStatus ps
                             ON p.[Status] = ps.Id
                             WHERE ps.Name = 'Deleted'
                                 AND psl.StockOnHand = 0
                                 AND psl.StockOnOrder = 0
                                 AND psl.StockAvailable = 0)
        GROUP BY CONVERT(INT, CONVERT(VARCHAR(8), DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate), 112))
                 , CAST(DATEADD(mi, DATEDIFF(mi, GETUTCDATE(), GETDATE()), coc.TransactionDate) AS DATE)
                 , l.SalesId, l.Name, l.Fascia, coc.SaleType, ISNULL(division.Tag, '(Unknown Division)')
    )

    SELECT ROW_NUMBER() OVER(ORDER BY DateKey) AS Id,
           data.*
    FROM (
            SELECT * FROM ExportData
            UNION ALL --Fascia
            SELECT DateKey, 
                   TransactionDate, 
                   f.FasciaId AS LocationId, 
                   Fascia AS LocationName, 
                   Fascia, 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData e
            INNER JOIN [Merchandising].[Merchandising.WTRFasciaView] f on e.Fascia = f.FasciaName
            GROUP BY DateKey, 
                     TransactionDate, 
                     f.FasciaId,
                     Fascia,
                     SaleType,
                     Division
            UNION ALL --Country
            SELECT DateKey, 
                   TransactionDate, 
                   0 AS LocationId, 
                   'Company' AS LocationName, 
                   'Company' AS Fascia,                 
                   SaleType AS SaleType, 
                   Division AS Division, 
                   SUM(Price) AS Price, 
                   SUM(GrossProfit) AS GrossProfit
            FROM ExportData
            GROUP BY DateKey, 
                     TransactionDate,
                     SaleType,
                     Division
        ) AS data
GO