IF EXISTS (SELECT * FROM sys.views WHERE object_id = object_id(N'[Merchandising].[VendorReturnView]'))
	DROP VIEW [Merchandising].[VendorReturnView]
GO

CREATE VIEW [Merchandising].[VendorReturnView] 
AS

SELECT DISTINCT
    vr.Id,
	vr.Comments,
	vr.CreatedDate,
	vr.CreatedById,
	vr.CreatedBy,
	vr.ApprovedBy,
	vr.ApprovedById,
	vr.ApprovedDate,
	vr.ReceiptType,
	vr.GoodsReceiptId,
	vr.ReferenceNumber,
	COALESCE(gr.ReceivedBy, dr.ReceivedBy) ReceivedBy,
	COALESCE(gr.ReceivedById, dr.ReceivedById) ReceivedById,
	COALESCE(gr.LocationId, dr.LocationId) LocationId,
	COALESCE(gr.Location, dr.Location) Location,
	COALESCE(gr.DateReceived, dr.DateReceived) DateReceived,
	COALESCE(gr.VendorDeliveryNumber, dr.VendorDeliveryNumber) VendorDeliveryNumber,
	COALESCE(gr.VendorInvoiceNumber, dr.VendorInvoiceNumber) VendorInvoiceNumber,
	COALESCE(grp.VendorId, dr.VendorId) VendorId,
	COALESCE(grp.Vendor, dr.Vendor) Vendor,
	l.SalesId SalesLocationId
FROM Merchandising.VendorReturn vr
LEFT JOIN Merchandising.GoodsReceipt gr 
	ON vr.GoodsReceiptId = gr.Id 
	AND vr.ReceiptType = 'Standard'
LEFT JOIN Merchandising.GoodsReceiptProductView grp 
	ON grp.GoodsReceiptId = gr.Id
LEFT JOIN Merchandising.GoodsReceiptDirect dr 
	ON vr.GoodsReceiptId = dr.Id 
	AND vr.ReceiptType = 'Direct'
LEFT JOIN Merchandising.Location l 
	ON gr.LocationId = l.Id 
	OR dr.LocationId = l.Id