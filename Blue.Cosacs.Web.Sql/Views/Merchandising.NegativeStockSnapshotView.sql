DROP VIEW [Merchandising].[NegativeStockSnapshotView]
GO

CREATE VIEW [Merchandising].[NegativeStockSnapshotView] 
AS

SELECT 
	s.*, 
	l.Fascia,
	l.Name as 'Location',
	p.SKU as 'Sku',
	p.LongDescription as 'Description',
	p.ProductType,
	p.Tags,
	x.DateLastReceived
FROM Merchandising.NegativeStockSnapshot s
INNER JOIN Merchandising.Location l 
	ON s.LocationId = l.Id
INNER JOIN Merchandising.Product p 
	ON s.ProductId = p.Id
	AND (NULLIF (NULLIF (p.storetypes, ''), '[]') IS NULL 
	OR p.storetypes LIKE '%"' + l.storetype + '"%')
Left JOIN (
	SELECT 
		pop.productId, 
		gr.locationid, 
		MAX(gr.CreatedDate) as DateLastReceived
	FROM Merchandising.GoodsReceiptProduct grp
	INNER JOIN Merchandising.PurchaseOrderProduct pop
		ON grp.PurchaseOrderProductId =  pop.id
	INNER JOIN Merchandising.GoodsReceipt gr
		ON grp.GoodsReceiptId = gr.id
	GROUP BY 
		pop.productId, 
		gr.locationid
) AS x 
	ON x.productId = p.id 
	and x.LocationId = l.id

GO