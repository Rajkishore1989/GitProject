
IF OBJECT_ID('Warranty.PriceCalcDataView') IS NOT NULL
    DROP VIEW Warranty.PriceCalcDataView
GO

CREATE VIEW Warranty.PriceCalcDataView
AS
    SELECT
        P.Id,
        P.warrantyid,
        P2.EffectiveDate,
        P2.CostPrice,
        P2.RetailPrice,
        P2.CostPriceChange,
        P2.CostPricePercentChange,
        P2.RetailPriceChange,
        P2.RetailPricePercentChange,
        P2.TaxInclusivePriceChange,
        P2.TaxInclusivePricePercentChange,
        ROW_NUMBER() OVER(PARTITION BY P.id ORDER BY P2.EffectiveDate) AS [Level]
    FROM
        Warranty.WarrantyPrice P
        INNER JOIN Warranty.WarrantyPrice P2
            ON P.WarrantyId = P2.WarrantyId
            AND ISNULL(P.BranchType, '') = ISNULL(P2.BranchType, '')
            AND ISNULL(P.BranchNumber, -1) = ISNULL(P2.BranchNumber, -1)
            AND P.EffectiveDate = P2.EffectiveDate
    WHERE
        P.EffectiveDate >= P2.EffectiveDate
GO

IF OBJECT_ID('Warranty.PriceCalcView') IS NOT NULL
    DROP VIEW Warranty.PriceCalcView
GO

CREATE VIEW Warranty.PriceCalcView
AS
    /*WITH PriceTree(Id, CostPrice, CostPriceAddValue,
                   RetailPrice, RetailPriceAddValue, RetailTaxInclusivePriceAddValue,
                   CostPriceChange, CostPricePercentChange, RetailPriceChange, RetailPricePercentChange,
                   TaxInclusivePriceChange, TaxInclusivePricePercentChange, [Level]) AS
    (
        SELECT Id,
               CostPrice,
               CONVERT(DECIMAL(19,3),0.00) AS CostPriceAddValue,
               RetailPrice,
               CONVERT(DECIMAL(19,3),0.00) AS RetailPriceAddValue,
               CONVERT(DECIMAL(19,3),0.00) AS RetailTaxInclusivePriceAddValue,
               CostPriceChange, CostPricePercentChange, RetailPriceChange, RetailPricePercentChange,
               TaxInclusivePriceChange, TaxInclusivePricePercentChange, [Level]
        FROM Warranty.PriceCalcDataView
        WHERE CostPrice IS NOT NULL AND RetailPrice IS NOT NULL AND [Level] = 1

        UNION ALL

        SELECT PD.Id,
               PTree.CostPrice,
               CONVERT(DECIMAL(19,3),
               CASE
                   WHEN PD.CostPriceChange IS NOT NULL
                   THEN PD.CostPriceChange
                   ELSE PTree.CostPrice * PD.CostPricePercentChange / 100.00
               END) AS CostPriceAddValue,
               PTree.RetailPrice,
               CONVERT(DECIMAL(19,3),
                   CASE
                       WHEN PD.RetailPriceChange  IS NOT NULL
                       THEN PD.RetailPriceChange
                       ELSE PTree.RetailPrice * PD.RetailPricePercentChange / 100.00
                   END) AS RetailPriceAddValue,
               CONVERT(DECIMAL(19,3),
                   CASE
                       WHEN PD.TaxInclusivePriceChange IS NOT NULL
                       THEN PD.TaxInclusivePriceChange
                       ELSE PTree.RetailPrice * PD.TaxInclusivePricePercentChange / 100.00
               END) AS RetailTaxInclusivePriceAddValue,
               PD.CostPriceChange,
               PD.CostPricePercentChange,
               PD.RetailPriceChange,
               PD.RetailPricePercentChange,
               PD.TaxInclusivePriceChange,
               PD.TaxInclusivePricePercentChange,
               PD.[Level]
        FROM
            Warranty.PriceCalcDataView PD
            INNER JOIN PriceTree PTree
                ON PTree.Id = PD.Id
                AND PTree.[Level] = PD.[Level] - 1
        WHERE
            PD.[Level] > 1
    )

    SELECT
        Sub.Id,
        WarrantyId,
        W.Number AS WarrantyNumber,
        BranchType,
        BranchNumber,
        CostPrice,
        RetailPrice, 
        RetailTaxInclusivePrice,
        EffectiveDate,
        CostPriceChange,
        CostPricePercentChange,
        RetailPriceChange,
        RetailPricePercentChange,
        CASE
            WHEN (M.Value = 'I')
            THEN RetailPrice * ( 1 + isnull(W.TaxRate,0) / 100 )
            ELSE RetailPrice
        END AS TaxInclusivePriceChange,
        TaxInclusivePricePercentChange,
        BulkEditId,
        M.Value AS AgrmtTaxType,
        W.TaxRate,
        CAST(CASE WHEN W.TypeCode = 'F' THEN 1 ELSE 0 END AS BIT) AS IsFree
    FROM 
    (
        SELECT T.Id,
            MAX(WP.WarrantyId) AS WarrantyId,
            MAX(WP.BranchType) AS BranchType,
            MAX(WP.BranchNumber) AS BranchNumber,
            CAST(AVG(T.CostPrice) AS DECIMAL(19,3)) + CAST(SUM(T.CostPriceAddValue) AS DECIMAL(19,3)) AS CostPrice,
            CAST(AVG(T.RetailPrice) AS DECIMAL(19,3)) + CAST(SUM(T.RetailPriceAddValue) AS DECIMAL(19,3)) AS RetailPrice,
            CAST(AVG(T.RetailPrice) AS DECIMAL(19,3)) + CAST(SUM(T.RetailTaxInclusivePriceAddValue) AS DECIMAL(19,3)) AS RetailTaxInclusivePrice,
            MAX(WP.EffectiveDate) AS EffectiveDate,
            MAX(WP.CostPriceChange) AS CostPriceChange, MAX(WP.CostPricePercentChange) AS CostPricePercentChange,
            MAX(WP.RetailPriceChange) AS RetailPriceChange, MAX(WP.RetailPricePercentChange) AS RetailPricePercentChange,
            MAX(WP.TaxInclusivePriceChange) AS TaxInclusivePriceChange,
            MAX(WP.TaxInclusivePricePercentChange) AS TaxInclusivePricePercentChange,
            MAX(WP.BulkEditId) AS BulkEditId
        FROM
            PriceTree T
            INNER JOIN Warranty.WarrantyPrice WP on T.Id = WP.Id
        GROUP BY
            T.Id,
            WarrantyId,
            BranchType,
            BranchNumber
    ) Sub
    INNER JOIN Warranty.Warranty W
        on Sub.WarrantyId = W.Id
    CROSS JOIN
    (
        SELECT Value FROM CountryMaintenance WHERE CodeName='AgrmtTaxType'
    ) M*/
	SELECT * FROM [Warranty].PriceCalcView11
GO

