IF OBJECT_ID('dbo.Olapview_Product') IS NOT NULL
	DROP VIEW Dbo.Olapview_Product
GO

CREATE VIEW dbo.Olapview_Product
AS

SELECT
	p.id,
	i.ID AS Productid,
	i.IUPC AS Product,
	LTRIM(RTRIM(i.itemdescr2)) AS [Description],
	i.itemtype,
	i.supplier,
	i.taxrate,
	h.Id AS CategoryCode,
	h.Name AS Category
FROM Merchandising.Product p
INNER JOIN StockInfo i
	ON p.SKU = i.itemno
LEFT JOIN Merchandising.ProductHierarchy ph
	ON ph.ProductId = p.id
	AND ph.HierarchyLevelId = 2
LEFT JOIN Merchandising.HierarchyTag h
	ON ph.HierarchyTagId = h.Id