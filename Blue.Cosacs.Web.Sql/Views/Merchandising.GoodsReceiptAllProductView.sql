IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[GoodsReceiptAllProductView]'))
	DROP VIEW [Merchandising].[GoodsReceiptAllProductView]
GO

CREATE VIEW [Merchandising].[GoodsReceiptAllProductView] 
AS

SELECT		
	grp.Id, 
	grp.GoodsReceiptId, 
	pop.ProductId, 
	gr.DateReceived, 
	gr.LocationId, 
	gr.CreatedDate 
FROM Merchandising.GoodsReceiptProduct grp 
INNER JOIN Merchandising.GoodsReceipt gr 
	ON grp.GoodsReceiptId = gr.Id
INNER JOIN Merchandising.PurchaseOrderProduct pop
	ON pop.id = grp.PurchaseOrderProductId

UNION ALL

SELECT  
	grdp.Id, 
	grdp.GoodsReceiptDirectId, 
	grdp.ProductId, 
	grd.DateReceived, 
	grd.LocationId, 
	grd.CreatedDate 
FROM Merchandising.GoodsReceiptDirectProduct grdp 
INNER JOIN Merchandising.GoodsReceiptDirect grd 
	ON grdp.GoodsReceiptDirectId = grd.Id
