IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[VendorReturnProductView]'))
DROP VIEW  [Merchandising].[VendorReturnProductView]
GO

create view [Merchandising].[VendorReturnProductView] as
SELECT
	ISNULL(CONVERT(Int,ROW_NUMBER() OVER (ORDER BY productid DESC)), 0) as Id
   ,vrp.GoodsReceiptProductId
   ,grp.GoodsReceiptId
   ,grp.PurchaseOrderProductId
   ,pop.PurchaseOrderId
   ,pop.ProductId  
   ,pop.Sku [ProductCode]
   ,pop.[Description]  
   ,grp.QuantityReceived  
   ,grp.LastLandedCost
   ,vrp.Comments
   ,vr.Id [VendorReturnId]
   ,vr.CreatedDate
   ,gr.LocationId AS GoodsReceiptLocationId
   ,po.VendorId
   ,po.Vendor
   ,ISNULL(vrp.QuantityReturned, 0) AS QuantityReturned
   ,(SELECT sum(vrp2.QuantityReturned) from Merchandising.VendorReturn vr2
		inner join Merchandising.VendorReturnProduct vrp2 on vr2.Id = vrp2.VendorReturnId
		WHERE vr2.Id != vr.Id
		AND vr2.ReceiptType = vr.ReceiptType
		AND vrp2.GoodsReceiptProductId = grp.Id
		GROUP BY vrp2.GoodsReceiptProductId) as QuantityPreviouslyReturned
FROM	
	Merchandising.GoodsReceipt gr 
	join
	Merchandising.GoodsReceiptProduct grp on grp.GoodsReceiptId = gr.Id
	join
	Merchandising.PurchaseOrderProduct pop on grp.PurchaseOrderProductId = pop.Id
	join
	Merchandising.PurchaseOrder po on pop.PurchaseOrderId = po.Id
	left join
	Merchandising.VendorReturn vr on vr.GoodsReceiptId = gr.Id	
	left join
	Merchandising.VendorReturnProduct vrp on vrp.VendorReturnId = vr.Id and grp.id = vrp.GoodsReceiptProductId
