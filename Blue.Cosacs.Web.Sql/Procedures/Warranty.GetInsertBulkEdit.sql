
IF EXISTS (SELECT * FROM sys.objects o INNER JOIN sys.schemas s ON o.schema_id = s.schema_id
           WHERE o.[type] = 'P' AND s.[name] = 'Warranty' AND o.[name] = 'GetInsertBulkEdit')
BEGIN
    DROP PROCEDURE [Warranty].[GetInsertBulkEdit]
END
GO

CREATE PROCEDURE [Warranty].[GetInsertBulkEdit]
    @FilteredWarrantyIds VARCHAR(5000),    
    @BulkEditEffectiveYear SMALLINT,
    @BulkEditEffectiveMonth SMALLINT,
    @BulkEditEffectiveDay SMALLINT,
    @CostPriceChange DECIMAL(19,3),
    @CostPricePercentChange DECIMAL(5,2),
    @CostPriceChangeTo DECIMAL(19,3),
    @RetailPriceChange DECIMAL(19,3),
    @RetailPricePercentChange DECIMAL(5,2),
    @RetailPriceChangeTo DECIMAL(19,3),
    @TaxInclusivePriceChange DECIMAL(19,3),
    @TaxInclusivePricePercentChange DECIMAL(5,2),
    @TaxInclusivePriceChangeTo DECIMAL(19,3),
    @InsertBulkEdit BIT = 0

AS
BEGIN

    DECLARE @BulkEditId INT = (SELECT ISNULL(MAX(P.BulkEditId),1) + 1 FROM Warranty.WarrantyPrice P),
            @BulkEditEffectiveDate DATE

    -- Convert EPOCH into DATE  --SELECT @BulkEditEffectiveDate = DATEADD(s, @BulkEditEffectiveDateEpoch, '197001011')
    SELECT @BulkEditEffectiveDate = CAST(
        CAST(@BulkEditEffectiveYear AS varchar) + '-' +
        CAST(@BulkEditEffectiveMonth AS varchar) + '-' +
        CAST(@BulkEditEffectiveDay AS varchar) AS DATE)

    DECLARE @BulkEditResultsTempTable TABLE (
        WarrantyId INT NOT NULL,
        WarrantyNumber VARCHAR(20) NOT NULL,
        BranchType VARCHAR(20) NULL,
        BranchNumber SMALLINT NULL,
        CostPrice DECIMAL(19,3) NULL, --BlueAmount
        RetailPrice DECIMAL(19,3) NULL, --BlueAmount
        IsCostChangeTo BIT NULL,
        IsRetailChangeTo BIT NULL,
        EffectiveDate DATE,
        CostPriceChange DECIMAL(19,3) NULL, --BlueAmount
        CostPricePercentChange DECIMAL(5,2) NULL, --BluePercentage
        RetailPriceChange DECIMAL(19,3) NULL, --BlueAmount
        RetailPricePercentChange DECIMAL(5,2) NULL, --BluePercentage
        TaxInclusivePriceChange DECIMAL(19,3) NULL, --BlueAmount
        TaxInclusivePricePercentChange DECIMAL(5,2) NULL, --BluePercentage
        BulkEditId INT,
        AgrmtTaxType VARCHAR(20),
        TaxRate DECIMAL(5,2),
        IsFree INT
    )

    IF (@BulkEditEffectiveDate >= CAST(GETDATE() AS DATE))
    BEGIN
        DECLARE @sep CHAR(1) = ','
        DECLARE @WarrantyBulkEditFilterIds TABLE ( filterId INT NOT NULL )
        ;WITH Splitter AS (
            SELECT CHARINDEX(@sep, @FilteredWarrantyIds) AS pos, 0 AS lastPos
            UNION ALL
            SELECT CHARINDEX(@sep, @FilteredWarrantyIds, pos + 1), pos
            FROM Splitter
            WHERE pos > 0
        )
        INSERT INTO @WarrantyBulkEditFilterIds
        SELECT filterId   FROM (
            SELECT CAST(
                SUBSTRING(@FilteredWarrantyIds, lastPos + 1,
                    CASE WHEN pos = 0
                        THEN 80000
                        ELSE pos - lastPos - 1
                    END
                )
            AS Int) AS filterId
            FROM Splitter
        ) Sub
        WHERE filterId IS NOT NULL AND filterId > 0
        OPTION (maxrecursion 0)

        INSERT INTO @BulkEditResultsTempTable(WarrantyId, WarrantyNumber,  BranchType, BranchNumber,
            CostPrice, RetailPrice, IsCostChangeTo, IsRetailChangeTo, EffectiveDate,
            CostPriceChange, CostPricePercentChange, RetailPriceChange, RetailPricePercentChange,
            TaxInclusivePriceChange, TaxInclusivePricePercentChange, BulkEditId, AgrmtTaxType, TaxRate, IsFree)
        -- Get groups for 'bulk edit' insert
        SELECT P.WarrantyId, Calc.WarrantyNumber, P.BranchType, P.BranchNumber,
               CONVERT(DECIMAL(19,3),
                   CASE WHEN @CostPriceChange IS NOT NULL AND @CostPriceChange <> 0
                   -- this value will not be used in the WarrantyPrice table (it's just indicative) 
                   THEN Calc.CostPrice + @CostPriceChange -- sum the change
                   ELSE 
                       CASE WHEN @CostPricePercentChange IS NOT NULL AND @CostPricePercentChange <> 0
                       -- this value will not be used in the WarrantyPrice table (it's just indicative) 
                       THEN Calc.CostPrice + (1 + @CostPricePercentChange / 100) -- add the % change
                       ELSE
                           CASE WHEN @CostPriceChangeTo IS NOT NULL AND @CostPriceChangeTo <> 0
                           -- will be used to set the new price (in the WarrantyPrice table)
                           THEN @CostPriceChangeTo -- just replace by the new value
                           ELSE Calc.CostPrice -- no changes detected
                           END
                       END
                   END
               ) AS [CostPrice],
               CONVERT(DECIMAL(19,3),
                   CASE WHEN @RetailPriceChange IS NOT NULL AND @RetailPriceChange <> 0
                   -- this value will not be used in the WarrantyPrice table (it's just indicative) 
                   THEN Calc.RetailPrice + @RetailPriceChange -- sum the change
                   ELSE 
                       CASE WHEN @RetailPricePercentChange IS NOT NULL AND @RetailPricePercentChange <> 0 OR
                                 @TaxInclusivePricePercentChange IS NOT NULL AND @TaxInclusivePricePercentChange <> 0
                       -- these values will not be used in the WarrantyPrice table (they're just indicative) 
                       THEN Calc.RetailPrice * (1 + @RetailPricePercentChange / 100) -- add the % change
                       ELSE
                           CASE WHEN @RetailPriceChangeTo IS NOT NULL AND @RetailPriceChangeTo <> 0
                           -- will be used to set the new price (in the WarrantyPrice table)
                           THEN @RetailPriceChangeTo -- just replace by the new value
                           ELSE
                               CASE WHEN @TaxInclusivePriceChange IS NOT NULL AND @TaxInclusivePriceChange <> 0
                               -- this value will not be used in the WarrantyPrice table (it's just indicative) 
                               THEN Calc.RetailPrice +
                                    (@TaxInclusivePriceChange / (1 + (Calc.TaxRate / 100))) -- remove the tax from the price
                               ELSE
                                   CASE WHEN @TaxInclusivePriceChangeTo IS NOT NULL AND @TaxInclusivePriceChangeTo <> 0
                                   -- will be used to set the new price (in the WarrantyPrice table)
                                   THEN @TaxInclusivePriceChangeTo / (1 + (Calc.TaxRate / 100)) -- remove the tax from the price
                                   ELSE Calc.RetailPrice -- no changes detected
                                   END
                               END -- @TaxInclusivePriceChange
                           END -- @RetailPriceChangeTo
                       END -- @RetailPricePercentChange and @TaxInclusivePricePercentChange
                   END -- @RetailPriceChange
               ) AS [RetailPrice],
               CASE WHEN @CostPriceChangeTo IS NOT NULL AND @CostPriceChangeTo <> 0 THEN 1 ELSE 0 END [IsCostChangeTo],
               CASE WHEN @RetailPriceChangeTo IS NOT NULL AND @RetailPriceChangeTo <> 0 OR
                         @TaxInclusivePriceChangeTo IS NOT NULL AND @TaxInclusivePriceChangeTo <> 0
                   THEN 1
                   ELSE 0
               END [IsRetailChangeTo],
               @BulkEditEffectiveDate EffectiveDate,
               @CostPriceChange CostPriceChange, @CostPricePercentChange CostPricePercentageChange,
               @RetailPriceChange RetailPriceChange, @RetailPricePercentChange RetailPricePercentageChange,
               @TaxInclusivePriceChange TaxInclusivePriceChange, @TaxInclusivePricePercentChange TaxInclusivePricePercentageChange,
               @BulkEditId BulkEditId,
               Calc.AgrmtTaxType, Calc.TaxRate, Calc.IsFree
        FROM Warranty.WarrantyPrice P
        INNER JOIN @WarrantyBulkEditFilterIds filter ON P.WarrantyId = filter.filterId
        INNER JOIN (
            -- Get all candidate groups for 'bulk edit' insert 
            SELECT WarrantyId, BranchType, BranchNumber, MAX(EffectiveDate) EffectiveDate
            FROM Warranty.WarrantyPrice
            -- 'EffectiveDate<@BulkEditEffectiveDate' rows with possible 'base prices'
            -- 'EffectiveDate=@BulkEditEffectiveDate' rows with possible clashes so they can be filtered
            WHERE EffectiveDate <= @BulkEditEffectiveDate
            GROUP BY WarrantyId, BranchType, BranchNumber
        ) PTypes ON P.WarrantyId = PTypes.WarrantyId
            AND ISNULL(P.BranchType, 0) = ISNULL(PTypes.BranchType, 0)
            AND ISNULL(P.BranchNumber, 0) = ISNULL(PTypes.BranchNumber, 0)
            AND  P.EffectiveDate = PTypes.EffectiveDate
            -- the 'bulk edit' doesn't support two 'clashing price rows' (meaning, rows with same values on
            -- WarrantyId, BranchType, BranchNumber and EffectiveDate)
            AND PTypes.EffectiveDate <> @BulkEditEffectiveDate -- so here we filter these clashing rows
        INNER JOIN Warranty.PriceCalcView Calc ON P.WarrantyId = Calc.WarrantyId
            AND ISNULL(P.BranchType, 0) = ISNULL(Calc.BranchType, 0)
            AND ISNULL(P.BranchNumber, 0) = ISNULL(Calc.BranchNumber, 0)
            AND Calc.EffectiveDate >= PTypes.EffectiveDate AND Calc.EffectiveDate < @BulkEditEffectiveDate
        WHERE Calc.IsFree<>1
        ORDER BY P.WarrantyId, P.BranchType, P.BranchNumber

        IF (@InsertBulkEdit<>0)
        BEGIN
            INSERT INTO Warranty.WarrantyPrice(
                WarrantyId, BranchType, BranchNumber, CostPrice, RetailPrice, EffectiveDate,
                CostPriceChange, CostPricePercentChange, RetailPriceChange, RetailPricePercentChange,
                TaxInclusivePriceChange, TaxInclusivePricePercentChange, BulkEditId)
            SELECT WarrantyId, BranchType, BranchNumber,
            CASE WHEN IsCostChangeTo<>0 THEN CostPrice ELSE NULL END AS CostPrice,
            CASE WHEN IsRetailChangeTo<>0 THEN RetailPrice ELSE NULL END AS RetailPrice,
            EffectiveDate,
            CostPriceChange, CostPricePercentChange, RetailPriceChange, RetailPricePercentChange,
            TaxInclusivePriceChange, TaxInclusivePricePercentChange,
            BulkEditId
            FROM @BulkEditResultsTempTable
        END
    END

    SELECT * FROM @BulkEditResultsTempTable

END
