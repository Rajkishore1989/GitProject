IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockAdjustmentProductView]'))
DROP VIEW  [Merchandising].[StockAdjustmentProductView]
GO

create view [Merchandising].[StockAdjustmentProductView] as
SELECT
  sap.*,
  sa.LocationId,
  sa.CreatedDate,  
  p.LongDescription,
  p.Sku  
FROM
	[Merchandising].StockAdjustmentProduct sap 
	JOIN [Merchandising].Product p ON sap.ProductId = p.Id
	JOIN [Merchandising].StockAdjustment sa ON sap.StockAdjustmentId = sa.Id
GO
