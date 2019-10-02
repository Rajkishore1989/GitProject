IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[LocationStockLevelView]'))
DROP VIEW [Merchandising].[LocationStockLevelView]
GO

CREATE VIEW [Merchandising].[LocationStockLevelView]
AS
SELECT p.Id as ProductId
,ISNULL(psl.StockOnHand,0) as StockOnHand
,ISNULL(psl.StockOnOrder,0) as StockOnOrder
,ISNULL(psl.StockAvailable,0) as StockAvailable
,ISNULL(psl.StockOnHand,0) - ISNULL(psl.StockAvailable,0) as StockAllocated
,l.Id as LocationId
,l.LocationId as LocationNumber
,l.SalesId
,l.Name
,l.Fascia
,l.StoreType
,l.Warehouse
,l.VirtualWarehouse
FROM Merchandising.Product p
CROSS JOIN Merchandising.Location l
LEFT JOIN Merchandising.ProductStockLevel psl
on psl.ProductId = p.id AND psl.LocationId = l.Id