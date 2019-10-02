IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ForceGoodsReceiptIndexView]'))
	DROP VIEW [Merchandising].[ForceGoodsReceiptIndexView]
GO

CREATE VIEW Merchandising.ForceGoodsReceiptIndexView
AS

SELECT 
	Convert(int, ROW_NUMBER() OVER( ORDER BY ReceiptId )) AS Id,
	ReceiptId,
	Type,
	CostConfirmed,
	Location,
	Vendor,
	VendorDeliveryNumber,
	VendorInvoiceNumber,
	CreatedBy,
	ApprovedBy,
	ReceivedBy,
	CreatedDate,
	DateApproved,
	DateReceived,
	Currency,
	TotalCost
FROM (
	SELECT 
		r.Id as ReceiptId,
		'Standard' as Type,
		r.CostConfirmed,
		L.LocationId + ' - ' + r.Location as Location, 
		S.Code + ' - ' + p.Vendor as Vendor, 
		r.VendorDeliveryNumber, 
		r.VendorInvoiceNumber, 
		r.CreatedBy as CreatedBy, 
		r.ApprovedBy as ApprovedBy, 
		r.ReceivedBy as ReceivedBy, 
		r.CreatedDate, 
		r.DateApproved, 
		r.DateReceived, 
		S.Currency,
		SUM(rp.UnitCost * rp.QuantityReceived) as TotalCost
	FROM Merchandising.GoodsReceipt R
	INNER JOIN (
		SELECT DISTINCT
			grp.GoodsReceiptId, 
			pp.PurchaseOrderId, 
			pp.UnitCost,
			grp.QuantityReceived
		FROM Merchandising.PurchaseOrderProduct pp
		INNER JOIN Merchandising.GoodsReceiptProduct grp
			ON grp.PurchaseOrderProductId = pp.Id
		WHERE grp.QuantityReceived > 0 
			AND pp.UnitCost > 0
	) rp
		ON r.Id = rp.GoodsReceiptId
	INNER JOIN Merchandising.PurchaseOrder P 
		ON p.Id = rp.PurchaseOrderId
	INNER JOIN Merchandising.Supplier S 
		ON S.Id = p.VendorId
	INNER JOIN Merchandising.Location L 
		ON L.Id = r.LocationId
	GROUP BY 
		r.Id, 
		r.CostConfirmed, 
		l.LocationId, 
		r.Location, 
		S.Code, 
		p.Vendor, 
		r.VendorDeliveryNumber, 
		r.VendorInvoiceNumber, 
		r.CreatedBy, 
		r.ApprovedBy, 
		r.ReceivedBy, 
		r.CreatedDate, 
		r.DateApproved, 
		r.DateReceived, 
		S.Currency

	UNION

	SELECT 
		r.Id as ReceiptId,
		'Direct' as Type,
		NULL as CostConfirmed,
		L.LocationId + ' - ' + r.Location as Location,
		S.Code + ' - ' + r.Vendor as Vendor,
		r.VendorDeliveryNumber, 
		r.VendorInvoiceNumber,
		r.CreatedBy as CreatedBy,
		r.ApprovedBy as ApprovedBy,
		r.ReceivedBy as ReceivedBy,
		r.CreatedDate, 
		r.DateApproved, 
		r.DateReceived,
		'LOCAL' [Currency],
		SUM(Rp.QuantityReceived * Rp.UnitLandedCost) as TotalCost
	FROM Merchandising.GoodsReceiptDirect r
	INNER JOIN Merchandising.GoodsReceiptDirectProduct rp 
		ON Rp.GoodsReceiptDirectId = r.Id
	INNER JOIN Merchandising.Supplier s 
		ON S.Id = r.VendorId
	INNER JOIN Merchandising.Location l
		ON L.Id = r.LocationId
	GROUP BY 
		r.Id,
		l.LocationId,
		r.Location,
		S.Code,
		r.Vendor,
		r.VendorDeliveryNumber,
		r.VendorInvoiceNumber,
		r.CreatedBy,
		r.ApprovedBy,
		r.ReceivedBy,
		r.CreatedDate,
		r.DateApproved,
		r.DateReceived
) as Receipts

GO