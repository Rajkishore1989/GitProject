IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[GoodsReceiptProductView]'))
DROP VIEW  [Merchandising].[GoodsReceiptProductView]
GO

create view [Merchandising].[GoodsReceiptProductView] as
select
	grp.Id
   ,grp.GoodsReceiptId
   ,gr.CostConfirmed
   ,gr.LocationId
   ,gr.CreatedDate
   ,gr.DateReceived
   ,grp.PurchaseOrderProductId
   ,pop.PurchaseOrderId
   ,pop.ProductId
   ,pop.EstimatedDeliveryDate
   ,po.VendorId
   ,po.Vendor
   ,v.Currency
   ,v.Type as VendorType
   ,pop.Sku [ProductCode]
   ,pop.[Description]
   ,pop.Comments
   ,pop.QuantityOrdered
   ,grp.LastLandedCost
   ,grp.QuantityReceived
   ,grp.QuantityBackOrdered
   ,grp.QuantityCancelled
   ,grp.ReasonForCancellation
from
	Merchandising.GoodsReceiptProduct grp
	join Merchandising.PurchaseOrderProduct pop on grp.PurchaseOrderProductId = pop.Id
	join Merchandising.PurchaseOrder po on pop.PurchaseOrderId = po.Id
	join Merchandising.Supplier v on po.VendorId = v.Id
	join Merchandising.GoodsReceipt gr on grp.goodsreceiptid = gr.id