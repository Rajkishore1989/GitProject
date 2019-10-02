IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[GoodsOnLoanProductView]'))
DROP VIEW  [Merchandising].[GoodsOnLoanProductView]
GO

CREATE VIEW [Merchandising].[GoodsOnLoanProductView] 
AS

SELECT 
	stp.*,
	p.Sku,
	p.LongDescription,
	b.BrandName [Brand],
	p.CorporateUPC,
	ht.Code [Category],
	p.VendorStyleLong [Model]
FROM Merchandising.Product p 
INNER JOIN Merchandising.GoodsOnLoanProduct stp 
	ON stp.ProductId = p.Id
INNER JOIN Merchandising.ProductHierarchy ph 
	ON ph.ProductId = p.Id
LEFT JOIN Merchandising.HierarchyLevel hl 
	ON ph.HierarchyLevelId = hl.Id
LEFT JOIN Merchandising.HierarchyTag ht 
	ON ht.LevelId = hl.Id 
	AND ph.HierarchyTagId = ht.Id
LEFT JOIN Merchandising.Brand b 
	ON b.Id = p.BrandId
WHERE hl.Name = 'Department'
