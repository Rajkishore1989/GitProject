IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3GoodsReceiptView]'))
	DROP VIEW [Merchandising].[RP3GoodsReceiptView]
GO

CREATE VIEW [Merchandising].[RP3GoodsReceiptView]
AS

SELECT DISTINCT
	gr.Id,
	gr.id as GRNNumber,
	s.code as VendorCode,
	po.Vendor as VendorName,
	l.SalesId as ReceivingLocationCode,
	gr.Location as ReceivingLocationName,
	s.Type as POType,
	gr.CostConfirmed as TransactionDate,
	po.id as PONumber,
	ISNULL(po.CorporatePoNumber, 0) as CorporatePONumber,
	gr.VendorInvoiceNumber as SupplierInvoiceNumber,
	gr.VendorDeliveryNumber as ReferenceNumber, 
	CASE
		WHEN DateApproved IS NULL THEN 'Awaiting Approval'
		ELSE 'Approved'
	END AS GRNStatus
FROM Merchandising.GoodsReceiptProduct grp
INNER JOIN Merchandising.GoodsReceipt gr
	ON grp.GoodsReceiptId = gr.id
INNER JOIN Merchandising.PurchaseOrderProduct pop
	ON grp.PurchaseOrderProductId = pop.Id
INNER JOIN Merchandising.PurchaseOrder po
	ON pop.PurchaseOrderId = po.id
INNER JOIN merchandising.supplier s
	ON po.VendorId = s.id
INNER JOIN merchandising.location l
	ON gr.LocationId = l.id
INNER JOIN Merchandising.Product p
	ON p.Id = pop.ProductId
WHERE gr.CostConfirmed IS NOT NULL
	AND p.ProductType IN ('ProductWithoutStock', 'RegularStock')

