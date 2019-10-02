IF  EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3StockAdjustmentProductView]')) 
	DROP VIEW [Merchandising].[RP3StockAdjustmentProductView]
GO

CREATE VIEW [Merchandising].[RP3StockAdjustmentProductView] 
AS

SELECT 
	sa.Id,
	sa.Id AS StockAdjustmentNumber,
	p.sku AS ProductCode,
	sap.Quantity AS UnitQuantity,
	sap.AverageWeightedCost AS UnitCost,
	rp.CashPrice AS UnitRetailPrice,
	sa.CreatedDate,
	sa.LocationId
FROM Merchandising.StockAdjustmentProduct sap
INNER JOIN Merchandising.StockAdjustment sa
	ON sap.StockAdjustmentId = sa.Id
INNER JOIN Merchandising.Product p
	ON sap.ProductId = p.id
INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
	ON rp.ProductId = sap.ProductId
	AND sa.LocationId = rp.locationid
WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')