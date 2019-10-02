IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockAllocationProductView]'))
	DROP VIEW [Merchandising].[StockAllocationProductView]
GO

CREATE VIEW [Merchandising].[StockAllocationProductView] 
AS

SELECT 
	stp.*,
	psl.StockAvailable,
	p.Sku,
	p.LongDescription,
	b.BrandName AS Brand,
	p.CorporateUPC,
	ph.DepartmentCode AS Category,
	p.VendorStyleLong AS Model,
	wl.SalesId AS WarehouseSalesLocationId,
	rl.SalesId AS ReceivingSalesLocationId,
	wl.Name AS WarehouseLocation,
	rl.Name AS ReceivingLocation,
	u.FullName AS CreatedBy,
	CASE 
		WHEN ISNULL(stp.Quantity, 0) > ISNULL(stp.QuantityCancelled, 0) + ISNULL(stp.QuantityReceived, 0) THEN 'Pending'
		WHEN ISNULL(stp.Quantity, 0) = ISNULL(stp.QuantityCancelled, 0) THEN 'Cancelled'
		ELSE 'Completed'
	END AS [Status]
FROM Merchandising.Product p 	
INNER JOIN Merchandising.StockAllocationProduct stp 
	ON stp.ProductId = p.Id
INNER JOIN [Admin].[User] u 
	ON stp.CreatedById = u.Id
INNER JOIN Merchandising.Location wl 
	ON stp.WarehouseLocationId = wl.Id
LEFT JOIN Merchandising.ProductStockLevel psl 
	ON psl.ProductId = p.Id 
	AND psl.LocationId = stp.WarehouseLocationId
INNER JOIN Merchandising.Location rl 
	ON stp.ReceivingLocationId = rl.Id
INNER JOIN Merchandising.ProductHierarchySummaryView ph 
	ON ph.ProductId = p.Id
	AND ph.DepartmentCode IS NOT NULL
LEFT JOIN Merchandising.Brand b 
	ON b.Id = p.BrandId

	