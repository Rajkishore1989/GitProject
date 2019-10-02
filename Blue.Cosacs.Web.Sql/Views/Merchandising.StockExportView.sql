IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockExportView]'))
DROP VIEW  [Merchandising].[StockExportView]
GO

CREATE VIEW [Merchandising].[StockExportView]
AS

SELECT DISTINCT
	stock.Id, 
	SalesId as WarehouseNo, 
	sku as ItemNo, 
	StockAvailable as StockFactAvailable,
	StockOnHand as StockActual, 
	StockOnOrder, 
	'00000000' as StockLastPlannedDate, 
	' 000000000' as StockDamage 
FROM merchandising.ProductStockLevel stock 
INNER JOIN Merchandising.product product ON product.id = stock.ProductId
INNER JOIN Merchandising.location Location ON stock.LocationId = location.Id
INNER JOIN Merchandising.ProductExportView export ON export.ProductId = stock.ProductId AND export.WarehouseNo = location.SalesId
