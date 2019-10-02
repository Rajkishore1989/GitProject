IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockRequisitionProductView]'))
	DROP VIEW [Merchandising].[StockRequisitionProductView]
GO

CREATE VIEW [Merchandising].[StockRequisitionProductView] 
AS

SELECT 
	stp.*,
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
INNER JOIN Merchandising.StockRequisitionProduct stp 
	ON stp.ProductId = p.Id
INNER JOIN Merchandising.Location wl 
	ON stp.WarehouseLocationId = wl.Id
INNER JOIN Merchandising.Location rl 
	ON stp.ReceivingLocationId = rl.Id
INNER JOIN [Admin].[User] u 
	ON stp.CreatedById = u.Id
INNER JOIN Merchandising.ProductHierarchySummaryView ph 
	ON ph.ProductId = p.Id
	AND ph.DepartmentCode IS NOT NULL
LEFT JOIN Merchandising.Brand b 
	ON b.Id = p.BrandId

	