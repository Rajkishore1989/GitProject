IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3VendorReturnProductView]')) 
	DROP VIEW [Merchandising].[RP3VendorReturnProductView]
GO

CREATE VIEW [Merchandising].[RP3VendorReturnProductView] 
AS

SELECT
	vrp.Id,
	vr.Id AS RTSNumber,
	gr.Id AS GRNNumber,
	po.Id AS PONumber,
	pop.Sku AS ProductCode,
	vrp.QuantityReturned AS UnitsReturned,
	pop.UnitCost AS SupplierUnitCost,
	ISNULL(po.Currency, s.Currency) AS SupplierCurrency,
	ISNULL(pop.PreLandedUnitCost, 0) AS PreLandedUnitCost,
	grp.LastLandedCost,
	rp.CashPrice AS UnitPrice,
	vr.CreatedDate AS TransactionDate,
	gr.LocationId
FROM merchandising.vendorreturnproduct vrp
INNER JOIN merchandising.VendorReturn vr
	ON vrp.VendorReturnId = vr.Id
INNER JOIN Merchandising.GoodsReceiptProduct grp
	ON grp.id = vrp.GoodsReceiptProductId
INNER JOIN Merchandising.GoodsReceipt gr
	ON grp.GoodsReceiptId = gr.id
INNER JOIN merchandising.PurchaseOrderProduct pop
	ON grp.PurchaseOrderProductId = pop.Id
INNER JOIN Merchandising.PurchaseOrder po
	ON pop.PurchaseOrderId = po.Id
INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
	ON rp.ProductId = pop.ProductId
	AND rp.locationid = gr.LocationId
INNER JOIN Merchandising.Product p
	ON p.Id = rp.ProductId
LEFT JOIN Merchandising.Supplier s
	ON s.Id = po.VendorId
WHERE vrp.QuantityReturned > 0
	AND p.ProductType IN ('ProductWithoutStock', 'RegularStock')
	AND vr.ReceiptType != 'Direct'
