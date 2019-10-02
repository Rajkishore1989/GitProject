IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductMessageView]'))
	DROP VIEW Merchandising.ProductMessageView
GO

CREATE VIEW Merchandising.ProductMessageView 
AS

SELECT
	p.Id,
	p.ProductType as Type,
	ph.LegacyCode as DepartmentCode
FROM Merchandising.Product p
LEFT JOIN Merchandising.ProductHierarchySummaryView ph 
	ON ph.ProductId = p.Id
	AND ph.DepartmentCode IS NOT NULL
