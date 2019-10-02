IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockCountProductView]'))
DROP VIEW  Merchandising.StockCountProductView
GO

create view Merchandising.StockCountProductView as
select
	 scp.Id
	,scp.StockCountId
	,scp.ProductId
	,p.Sku
	,p.LongDescription
	,p.Attributes
	,p.VendorUPC
	,scp.StartStockOnHand
	,scp.[Count]
	,scp.SystemAdjustment
	,scp.Count + scp.SystemAdjustment - scp.StartStockOnHand as Variance
	,ISNULL(psl.StockOnHand, 0) - StartStockOnHand as NetMovement
	,ISNULL(psl.StockOnHand, 0) as CurrentStockOnHand
	,scp.Comments
	,sc.LocationId
	,sc.[Type]
	,sc.CountDate
	,sc.ClosedDate
	,l.Name as LocationName
	,l.Fascia
	,scp.Hierarchy 
from
	Merchandising.Product p
	JOIN
	Merchandising.StockCountProduct scp ON scp.ProductId = p.Id
	JOIN 
	Merchandising.StockCount sc ON scp.StockCountId = sc.Id
	JOIN
	Merchandising.Location l ON l.Id = sc.LocationId
	LEFT JOIN
	Merchandising.ProductStockLevel psl ON psl.ProductId = p.Id AND psl.LocationId = l.Id