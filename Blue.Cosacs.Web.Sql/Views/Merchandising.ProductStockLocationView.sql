IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].ProductStockLocationView'))
	DROP VIEW [Merchandising].[ProductStockLocationView]
GO

CREATE VIEW [Merchandising].[ProductStockLocationView]
AS

SELECT
	psl.*,
	l.Name [LocationName],
	l.Warehouse,
	l.SalesId
FROM [Merchandising].[ProductStockLevel] psl
INNER JOIN [Merchandising].[Location] l 
	ON psl.LocationId = l.Id

GO