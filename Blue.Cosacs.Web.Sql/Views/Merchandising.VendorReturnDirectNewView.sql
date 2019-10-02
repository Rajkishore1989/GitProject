IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[VendorReturnDirectNewView]'))
DROP VIEW  [Merchandising].[VendorReturnDirectNewView]
GO

create view [Merchandising].[VendorReturnDirectNewView] as
SELECT
    grp.Id
   ,grp.Id [GoodsReceiptProductId]
   ,grp.GoodsReceiptDirectId [GoodsReceiptId]
   ,gr.VendorId
   ,gr.Vendor
   ,grp.ProductId  
   ,grp.Sku [ProductCode]
   ,grp.[Description]  
   ,grp.QuantityReceived 
   ,grp.UnitLandedCost 
   ,coalesce(sum(vrp.QuantityReturned),0) QuantityPreviouslyReturned
FROM	
	Merchandising.GoodsReceiptDirect gr 
	join
	Merchandising.GoodsReceiptDirectProduct grp on grp.GoodsReceiptDirectId = gr.Id
	left join
	Merchandising.VendorReturn vr on vr.GoodsReceiptId = gr.Id	and vr.ReceiptType = 'Direct'
	left join
	Merchandising.VendorReturnProduct vrp on vrp.GoodsReceiptProductId = grp.Id and vrp.VendorReturnId = vr.Id
group by
	grp.Id
   ,grp.GoodsReceiptDirectId
   ,gr.VendorId
   ,gr.Vendor
   ,grp.ProductId  
   ,grp.Sku
   ,grp.[Description]  
   ,grp.QuantityReceived
   ,grp.UnitLandedCost