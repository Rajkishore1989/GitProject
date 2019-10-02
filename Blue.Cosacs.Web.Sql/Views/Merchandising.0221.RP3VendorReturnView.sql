IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3VendorReturnView]'))
	DROP VIEW [Merchandising].[RP3VendorReturnView]
GO

CREATE VIEW [Merchandising].[RP3VendorReturnView] 
AS

SELECT DISTINCT
	vr.Id, 
	vr.Id as RTSNumber, 
	vr.GoodsReceiptId as GRNNumber, 
	po.id as PONumber, 
	ISNULL(po.CorporatePoNumber, 0) as CorporatePONumber, 
	s.Code as VendorCode, 
	po.vendor as VendorName, 
	l.SalesId as ReceivingLocationCode, 
	gr.Location as ReceivingLocationName,
	s.Type as POType, 
	vr.CreatedDate as TransactionDate, 
	gr.VendorInvoiceNumber as SupplierInvoiceNumber, 
	gr.VendorDeliveryNumber as ReferenceNumber
FROM Merchandising.VendorReturnProduct vrp
INNER JOIN Merchandising.VendorReturn vr
	ON vrp.VendorReturnId = vr.Id
INNER JOIN Merchandising.GoodsReceiptProduct grp
	ON grp.id = vrp.GoodsReceiptProductId
INNER JOIN Merchandising.GoodsReceipt gr
	ON gr.id = grp.GoodsReceiptId
INNER JOIN Merchandising.PurchaseOrderProduct pop
	ON grp.PurchaseOrderProductId = pop.Id
INNER JOIN Merchandising.Product p
	ON p.Id = pop.ProductId
INNER JOIN Merchandising.PurchaseOrder po
	ON pop.PurchaseOrderId = po.Id
INNER JOIN Merchandising.Supplier s
	ON po.VendorId = s.Id
INNER JOIN Merchandising.Location l
	ON l.id = gr.LocationId
WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
	AND vr.ReceiptType != 'Direct'


