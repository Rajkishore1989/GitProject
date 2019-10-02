IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[VendorReturnNewView]'))
DROP VIEW  [Merchandising].[VendorReturnNewView]
GO

CREATE VIEW [Merchandising].[VendorReturnNewView] 
AS

SELECT
   grp.Id,
   grp.Id [GoodsReceiptProductId],
   grp.GoodsReceiptId,
   grp.PurchaseOrderProductId,
   pop.PurchaseOrderId,
   po.VendorId,
   po.Vendor,
   pop.ProductId,
   pop.Sku ProductCode,
   pop.Description,
   grp.QuantityReceived,
   coalesce(sum(vrp.QuantityReturned),0) QuantityPreviouslyReturned,
   grp.LastLandedCost
FROM Merchandising.GoodsReceipt gr
INNER JOIN Merchandising.GoodsReceiptProduct grp
   ON grp.GoodsReceiptId = gr.Id
INNER JOIN Merchandising.PurchaseOrderProduct pop
   ON grp.PurchaseOrderProductId = pop.Id
INNER JOIN Merchandising.PurchaseOrder po
   ON pop.PurchaseOrderId = po.Id
LEFT JOIN Merchandising.VendorReturn vr
   ON vr.GoodsReceiptId = gr.Id
   AND vr.ReceiptType != 'Direct'
LEFT JOIN Merchandising.VendorReturnProduct vrp
   ON vrp.GoodsReceiptProductId = grp.Id
   AND vrp.VendorReturnId = vr.Id
GROUP BY
	grp.Id,
   grp.GoodsReceiptId,
   grp.PurchaseOrderProductId,
   pop.PurchaseOrderId,
   pop.ProductId,
   pop.Sku,
   pop.Description,
   grp.QuantityReceived,
   po.VendorId,
   po.Vendor,
   grp.LastLandedCost