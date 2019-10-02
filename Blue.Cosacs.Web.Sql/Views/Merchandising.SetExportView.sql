IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SetExportView]'))
	DROP VIEW [Merchandising].[SetExportView]
GO

CREATE VIEW [Merchandising].[SetExportView]
AS

SELECT
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY Parent, Child)) as Id,
	Parent,
	Child,
	Quantity
FROM
(
	SELECT
		parent.Sku as Parent,
		child.Sku as Child,
		sp.Quantity
	FROM Merchandising.SetProduct sp
	INNER JOIN Merchandising.Product parent
		ON sp.SetId = parent.id
	INNER JOIN Merchandising.Product child
		ON sp.ProductId = child.id
	INNER JOIN Merchandising.ProductStatus ps
		ON ps.id = parent.[Status]
	WHERE ps.Name != 'Non Active'

	UNION ALL

	SELECT
		parent.Sku as Parent,
		child.Sku as Child,
		cp.Quantity
	FROM Merchandising.ComboProduct cp
	INNER JOIN Merchandising.Product parent
		ON cp.ComboId = parent.id
	INNER JOIN Merchandising.Product child
		ON cp.ProductId = child.id
	INNER JOIN Merchandising.ProductStatus ps
		ON ps.id = parent.[Status]
	WHERE ps.Name != 'Non Active'
) as V

GO