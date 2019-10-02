IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SetView]'))
DROP VIEW  [Merchandising].[SetView]
GO

CREATE VIEW [Merchandising].[SetView] 
AS
SELECT	
	s.Id,	
	p.sku,
	p.LongDescription
FROM
	[Merchandising].[SetProduct] s
	LEFT JOIN
	[Merchandising].product p ON p.Id = s.Id
GO