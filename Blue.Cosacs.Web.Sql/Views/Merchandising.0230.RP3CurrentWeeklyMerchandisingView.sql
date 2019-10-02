IF EXISTS (SELECT * FROM sys.views WHERE name = 'RP3CurrentWeeklyMerchandisingView')
	DROP VIEW [Merchandising].[RP3CurrentWeeklyMerchandisingView]
GO

CREATE VIEW [Merchandising].[RP3CurrentWeeklyMerchandisingView]
AS

SELECT
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY p.id, l.id DESC)) AS Id,
	c.CountryName AS Country,
	DATEPART(YEAR, GETUTCDATE()) AS [ACYear],
	DATEPART(MONTH, GETUTCDATE()) AS [ACMonth],
	l.SalesId + ' - ' + l.Name AS Store,
	ph.DepartmentCode,
	ph.DepartmentName,
	ph.DivisionCode,
	ph.DivisionName,
	brand.BrandCode,
	brand.BrandName,
	supplier.Code AS SupplierCode,
	Supplier.Name AS SupplierName,
	p.VendorStyleLong,
	p.Sku,
	p.LongDescription,
	initialStock.StockOnHandQuantity AS InitialStockUnits,
	initialStock.StockOnHandSalesValue AS InitialStockCost,
	initialStock.StockOnHandValue AS InitialStockValue,
	ISNULL(gr.UnitsReceived, 0) - ISNULL(vr.UnitsReturned, 0) AS PurchUnits,
	ISNULL(gr.ActualLandedCost, 0) - ISNULL(vr.UnitsReturnedCost, 0) AS PurchValue,
	(ISNULL(gr.UnitsReceived, 0) - ISNULL(vr.UnitsReturned, 0)) * 
        COALESCE(endstock.CashPrice, oldLocationPricing.CashPrice, oldFasciaPricing.CashPrice, oldcountryPricing.CashPrice, 0) AS PurchSales,
	sales.Quantity AS UnitSales,
	sales.CostSales,
	sales.Price AS RetailSales,
	sa.UnitsReturned AS UnitAdj,
	sa.CostPrice AS CostAdj,
	sa.RetailPrice AS SalesAdj,
	st.UnitTrans AS UnitTrans,
	st.CostPrice AS CostTrans,
	st.RetailPrice AS SalesTrans,
	endStock.StockOnHandQuantity AS FinalStockUnits,
	endStock.StockOnHandSalesValue AS FinalStockCost,
	endStock.StockOnHandValue AS FinalStockValue,
	sales.Discount,
	ISNULL(lastGoodsReceipt.LastReceivedDate, '1900/01/01') AS LastPDate,
	ISNULL(LastSales.LastTransactionDate, '1900/01/01') AS LastSDate,
	ISNULL(stockmovement.LastTDate, '1900/01/01') AS LastTDate,
	ISNULL(lastGoodsReceipt.FirstReceivedDate, '1900/01/01') AS FirstRDate
FROM merchandising.product p
CROSS JOIN Merchandising.Location l
CROSS JOIN dbo.Country c
INNER JOIN Merchandising.Brand brand
	ON brand.Id = p.BrandId
INNER JOIN Merchandising.Supplier supplier
	ON Supplier.Id = p.PrimaryVendorId
INNER JOIN Merchandising.ProductHierarchySummaryView ph
	ON ph.ProductId = p.id
LEFT JOIN Merchandising.StockValuationSnapshot initialStock
	ON initialstock.LocationId = l.id
	AND initialstock.ProductId = p.Id
	AND initialstock.SnapshotDateId = CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfPreviousMonth(GETUTCDATE()), 112))
LEFT JOIN (
	SELECT
		ProductCode,
		LocationId,
		SUM(unitsreceived) AS UnitsReceived,
		SUM(actuallandedcost * UnitsReceived) AS ActualLandedCost,
		SUM(unitprice * UnitsReceived) AS UnitPrice
	FROM [Merchandising].[RP3GoodsReceiptProductView]
	WHERE CONVERT(INT, CONVERT(VARCHAR, createddate, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
		AND CONVERT(INT, CONVERT(VARCHAR, createddate, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
        AND CreatedDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY productcode, LocationId
) gr
	ON p.sku = gr.productcode
	AND l.id = gr.LocationId
LEFT JOIN (
	SELECT
		ProductCode,
		LocationId,
		SUM(UnitsReturned) AS UnitsReturned,
		SUM(UnitsReturned * LastLandedCost) AS UnitsReturnedCost
	FROM [Merchandising].[RP3VendorReturnProductView]
	WHERE CONVERT(INT, CONVERT(VARCHAR, TransactionDate, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
		AND CONVERT(INT, CONVERT(VARCHAR, TransactionDate, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
        AND TransactionDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY productcode, LocationId
) vr
	ON p.sku = vr.productcode
	AND l.id = vr.LocationId
LEFT JOIN (
	SELECT
		p.Id AS ProductId,
		l.id AS LocationId,
		SUM (-1 * co.Quantity) AS Quantity,
		SUM (cp.AverageWeightedCost * (-1 * co.Quantity)) AS CostSales,
		SUM (-1 * ( (co.Quantity * (co.CashPrice + co.Discount/ABS(co.Quantity)) ) ) ) AS Price,
		SUM(CASE 
                WHEN co.[Type] = 'Delivery' THEN co.Discount
                ELSE -1 * co.Discount
            END) AS Discount
	FROM Merchandising.CintOrder co
	INNER JOIN Merchandising.product p
		ON p.sku = co.Sku
	INNER JOIN Merchandising.Location l
		ON co.SaleLocation = l.salesid
	INNER JOIN Merchandising.CostPrice cp
		ON cp.ProductId = p.Id
		AND cp.AverageWeightedCostUpdated =
		(
			SELECT MAX(AverageWeightedCostUpdated)
			FROM Merchandising.CostPrice
			WHERE AverageWeightedCostUpdated <= co.TransactionDate
				AND ProductId = cp.ProductId
		)
        AND cp.Id =
		(
			SELECT MAX(Id)
			FROM Merchandising.CostPrice
			WHERE AverageWeightedCostUpdated = cp.AverageWeightedCostUpdated
				AND ProductId = cp.ProductId
		)
	WHERE Type IN ('Delivery', 'Return')
		AND CONVERT(INT, CONVERT(VARCHAR, TransactionDate, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
		AND CONVERT(INT, CONVERT(VARCHAR, TransactionDate, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
        AND TransactionDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY p.id, l.Id
) sales
	ON p.id = sales.ProductId
	AND l.id = sales.LocationId
LEFT JOIN (
	SELECT
		ProductCode,
		LocationId,
		SUM(UnitQuantity) AS UnitsReturned,
		SUM(UnitQuantity * UnitCost) AS CostPrice,
		SUM(UnitQuantity * UnitRetailPrice) AS RetailPrice
	FROM [Merchandising].RP3StockAdjustmentProductView
	WHERE CONVERT(INT, CONVERT(VARCHAR, CreatedDate, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
		AND CONVERT(INT, CONVERT(VARCHAR, CreatedDate, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
        AND CreatedDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY productcode, LocationId
) sa
	ON p.sku = sa.productcode
	AND l.id = sa.LocationId
LEFT JOIN Merchandising.StockValuationSnapshot endStock
	ON endstock.SnapshotDateId = CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
	AND endStock.ProductId = p.Id
	AND endstock.LocationId = l.id
LEFT JOIN (SELECT * 
           FROM Merchandising.RetailPrice oldRP
           WHERE EffectiveDate = (SELECT MAX(EffectiveDate) 
                                  FROM Merchandising.RetailPrice
                                  WHERE oldRP.ProductId = ProductId
                                      AND ISNULL(oldRP.LocationId, 0) = ISNULL(LocationId, 0)
                                      AND ISNULL(oldRP.Fascia, '') = ISNULL(Fascia, '')
                                      AND EffectiveDate <= dbo.LastDayOfCurrentMonth(GETUTCDATE())) 
          )oldLocationPricing
ON oldLocationPricing.ProductId = p.Id
    AND oldLocationPricing.LocationId = l.Id
LEFT JOIN (SELECT * 
           FROM Merchandising.RetailPrice oldRP
           WHERE EffectiveDate = (SELECT MAX(EffectiveDate) 
                                  FROM Merchandising.RetailPrice
                                  WHERE oldRP.ProductId = ProductId
                                      AND ISNULL(oldRP.LocationId, 0) = ISNULL(LocationId, 0)
                                      AND ISNULL(oldRP.Fascia, '') = ISNULL(Fascia, '')
                                      AND EffectiveDate <= dbo.LastDayOfCurrentMonth(GETUTCDATE())) 
          )oldFasciaPricing
ON oldFasciaPricing.ProductId = p.Id
    AND oldFasciaPricing.Fascia = l.Fascia
    AND oldFasciaPricing.LocationId IS NULL
LEFT JOIN (SELECT * 
           FROM Merchandising.RetailPrice oldRP
           WHERE EffectiveDate = (SELECT MAX(EffectiveDate) 
                                  FROM Merchandising.RetailPrice
                                  WHERE oldRP.ProductId = ProductId
                                      AND ISNULL(oldRP.LocationId, 0) = ISNULL(LocationId, 0)
                                      AND ISNULL(oldRP.Fascia, '') = ISNULL(Fascia, '')
                                      AND EffectiveDate <= dbo.LastDayOfCurrentMonth(GETUTCDATE())) 
          )oldcountryPricing
ON oldcountryPricing.ProductId = p.Id
    AND oldcountryPricing.Fascia IS NULL
    AND oldcountryPricing.LocationId IS NULL
LEFT JOIN (
	SELECT
		pop.productId,
		gr.locationid,
		MAX(gr.createddate) AS LastReceivedDate,
		MIN(gr.createdDate) AS FirstReceivedDate
	FROM Merchandising.GoodsReceiptProduct grp
	INNER JOIN Merchandising.PurchaseOrderProduct pop
		ON grp.PurchaseOrderProductId = pop.id
	INNER JOIN Merchandising.GoodsReceipt gr
		ON grp.GoodsReceiptId = gr.id
    WHERE gr.CreatedDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
        AND grp.QuantityReceived > 0
	GROUP BY pop.productId, gr.locationid
) lastGoodsReceipt
	ON p.id = lastGoodsReceipt.ProductId
	AND l.id = lastGoodsReceipt.LocationId
LEFT JOIN (
	SELECT
		agregate.ProductCode,
		agregate.ReceivingLocationId,
		SUM(agregate.UnitTrans) AS UnitTrans,
		SUM(agregate.CostPrice) AS CostPrice,
		SUM(agregate.RetailPrice) AS RetailPrice
	FROM 
	(
		SELECT
			ProductCode,
			ReceivingLocationId,
			SUM(ReceivingUnits) AS UnitTrans,
			SUM(ReceivingUnits * UnitCost) AS CostPrice,
			SUM(ReceivingUnits * UnitPrice) AS RetailPrice
		FROM [Merchandising].RP3StockTransferProductView
		WHERE CONVERT(INT, CONVERT(VARCHAR, DateProcessed, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
			AND CONVERT(INT, CONVERT(VARCHAR, DateProcessed, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
            AND DateProcessed > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
		GROUP BY productcode, ReceivingLocationId
		UNION
		SELECT
			ProductCode,
			SendingLocationId AS ReceivingLocationId,
			-SUM(SendingUnits) AS UnitTrans,
			-SUM(SendingUnits * UnitCost) AS CostPrice,
			-SUM(SendingUnits * UnitPrice) AS RetailPrice
		FROM [Merchandising].RP3StockTransferProductView
		WHERE CONVERT(INT, CONVERT(VARCHAR, DateProcessed, 112)) >= CONVERT(INT, CONVERT(VARCHAR, dbo.FirstDayOfCurrentMonth(GETUTCDATE()), 112))
			AND CONVERT(INT, CONVERT(VARCHAR, DateProcessed, 112)) <= CONVERT(INT, CONVERT(VARCHAR, dbo.LastDayOfCurrentMonth(GETUTCDATE()), 112))
            AND DateProcessed > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
		GROUP BY productcode, SendingLocationId
	) agregate
	GROUP BY agregate.ProductCode, agregate.ReceivingLocationId
) st
	ON p.sku = st.productcode
	AND l.SalesId = st.ReceivingLocationId
LEFT JOIN (
	SELECT
		p.id AS ProductId,
		l.id AS LocationId,
		MAX(co.TransactionDate) AS LastTransactionDate
	FROM Merchandising.CintOrder co
	INNER JOIN merchandising.location l
		ON co.SaleLocation = l.SalesId
	INNER JOIN Merchandising.Product p
		ON co.sku = p.sku
    WHERE co.TransactionDate > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY p.id, 	l.id
) LastSales
	ON LastSales.ProductId = p.Id
	AND LastSales.LocationId = l.Id
LEFT JOIN (
	SELECT
		productId,
		locationid,
		MAX(dateprocessedUTC) AS LastTDate
	FROM Merchandising.StockMovementReportView s
    WHERE s.DateProcessedUTC > DATEADD(SECOND, DATEDIFF(SECOND, GETDATE(), GETUTCDATE()), (SELECT ValueDateTime FROM Config.Setting WHERE id = 'RP3GoLiveDate'))
	GROUP BY productId, locationid
) stockmovement
	ON p.id = stockmovement.productid
	AND l.id = stockmovement.locationid
WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
    AND p.Id NOT IN (SELECT p.Id 
                     FROM Merchandising.Product p
                     INNER JOIN Merchandising.ProductStatus s
                     ON p.[Status] = s.Id 
                     WHERE s.Name = 'Deleted'
                       OR 
                        (s.Name = 'Non Active' 
		                 AND NOT EXISTS (SELECT 'a' FROM Merchandising.ProductStockLevel st WHERE st.ProductId = p.Id AND st.StockOnHand > 0))
	                )       

GO