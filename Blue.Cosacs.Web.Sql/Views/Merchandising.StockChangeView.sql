IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockChangeView]'))
DROP VIEW  [Merchandising].StockChangeView
GO

create view [Merchandising].StockChangeView
as
select ROW_NUMBER() OVER (ORDER BY pop.purchaseorderID) id,
pop.PurchaseOrderId,
gr.Id GoodsRecieptId,
pop.ProductId,
isnull(gr.LocationId, po.ReceivingLocationId) LocationId,
ISNULL(grp.QuantityCancelled,0) + ISNULL(pop.QuantityCancelled,0) as 'QuantityCancelled',
ISNULL(grp.QuantityReceived,0) as 'QuantityReceived'
from Merchandising.PurchaseOrderProduct pop
inner join Merchandising.PurchaseOrder po on po.Id = pop.PurchaseOrderId
left join Merchandising.GoodsReceiptProduct grp on grp.PurchaseOrderProductId = pop.Id
left join Merchandising.GoodsReceipt gr on gr.Id = grp.GoodsReceiptId

