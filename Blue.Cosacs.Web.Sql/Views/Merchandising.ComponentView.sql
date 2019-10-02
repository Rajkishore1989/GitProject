IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.ComponentView'))
DROP VIEW Merchandising.[ComponentView]
GO

CREATE VIEW [Merchandising].[ComponentView]
AS


SELECT ROW_NUMBER() OVER (ORDER BY parentId DESC) as Id,
ProductId,ParentId,SKU,LongDescription, Quantity
FROM (
SELECT
	 c.Id
	,c.ProductId
	,c.ComboId as ParentId
	,p.SKU
	,p.LongDescription
	,c.Quantity
FROM
	Merchandising.ComboProduct c
	JOIN
	Merchandising.Product p ON p.Id = c.ProductId
UNION
SELECT
	 c.Id
	,c.ProductId
	,c.SetId as ParentId
	,p.SKU
	,p.LongDescription
	,c.Quantity	
FROM
	Merchandising.SetProduct c
	JOIN
	Merchandising.Product p ON p.Id = c.ProductId
	) as CView
GO