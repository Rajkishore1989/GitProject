IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[HyperionCurrentPriceView]'))
	DROP VIEW [Merchandising].[HyperionCurrentPriceView]
GO

CREATE VIEW [Merchandising].[HyperionCurrentPriceView]
AS

SELECT
	ROW_NUMBER() OVER(ORDER BY ph.ClassCode DESC) AS Id,
	CASE
		WHEN loc.Fascia = 'Courts' THEN 'C'
		ELSE 'N'
	END AS ChainCode,
	ph.ClassCode AS ClassCode,
	loc.SalesId AS SalesLocation,
	ph.ClassName + '_en' AS ClassDescription,
	brand.BrandCode,
	brand.BrandName + '_en' AS BrandName,
	ISNULL(SUM(psl.CashPrice * psl.StockOnHandQuantity), 0) AS InventorySalePrice,
	ISNULL(SUM(cost.AverageWeightedCost * psl.StockOnHandQuantity), 0) AS InventoryCosts,
	ISNULL(SUM(psl.StockOnHandQuantity), 0) AS InventoryUnits,
	ISNULL(SUM(TotalReceived), 0) AS TotalReceived,
	ISNULL(SUM(TotalCost), 0) AS TotalCost,
	ISNULL(SUM(psl.CashPrice * TotalReceived), 0) AS PurchaseSalePrice,
	ISNULL(SUM(TotalSalesValue), 0) AS TotalSalesValue,
	ISNULL(SUM(TotalSalesUnits), 0) AS TotalSalesUnits,
	ISNULL(SUM(cost.AverageWeightedCost * TotalSalesUnits), 0) AS SalesCostWithoutTax,
	ISNULL(SUM(TotalReturnsValue), 0) AS TotalReturnsValue,
	ISNULL(SUM(TotalReturnsUnits), 0) AS TotalReturnsUnits,
	ISNULL(SUM((TotalSalesValue - (cost.AverageWeightedCost * TotalSalesUnits))
		/ ISNULL(NULLIF(TotalSalesValue, 0), 1)), 0) AS InventoryProductMargin
FROM Merchandising.Product product
CROSS JOIN Merchandising.Location loc
INNER JOIN Merchandising.Brand brand
	ON brand.Id = product.BrandId
INNER JOIN Merchandising.ProductHierarchySummaryView ph
	ON ph.ProductId = product.id
	AND ph.ClassCode IS NOT NULL
INNER JOIN Merchandising.CurrentCostPriceView cost
	ON product.id = cost.productid
LEFT JOIN Merchandising.StockValuationSnapshot psl
	ON product.Id = psl.ProductId
	AND psl.SnapshotDateId = CONVERT(INT, CONVERT(VARCHAR(8), dbo.LastDayOfCurrentMonth(GETDATE()), 112))
	AND psl.LocationId = loc.Id
LEFT JOIN Merchandising.HyperionGoodsReceivedView hgrv
	ON product.Id = hgrv.Id
	AND loc.id = hgrv.locationId
LEFT JOIN Merchandising.HyperionSalesView hsv
	ON product.Id = hsv.Id
	AND loc.Id	= hsv.LocationId
WHERE product.ProductType NOT IN ('RepossessedStock', 'SparePart')
GROUP BY ph.ClassCode,
	CASE
		WHEN loc.Fascia = 'Courts' THEN 'C'
		ELSE 'N'
	END,
	loc.SalesId,
	ph.ClassName,
	brand.BrandCode,
	brand.BrandName

GO