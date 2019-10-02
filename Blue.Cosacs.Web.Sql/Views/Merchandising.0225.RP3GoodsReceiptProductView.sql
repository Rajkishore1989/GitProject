IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3GoodsReceiptProductView]')) 
	DROP VIEW [Merchandising].[RP3GoodsReceiptProductView]
GO

CREATE VIEW [Merchandising].[RP3GoodsReceiptProductView] 
AS

SELECT
	gr.Id,
	gr.id as GRNNumber,
	po.id as PONumber,
	pop.Sku as ProductCode,
	grp.QuantityReceived as UnitsReceived,
	pop.UnitCost as SupplierUnitCost,
	ISNULL(po.Currency, s.Currency) as SupplierCurrency,
	CASE 
		WHEN po.OriginSystem = 'EBS11i' THEN ISNULL(pop.PreLandedUnitCost, 0)
		ELSE 0
	END as PreLandedUnitCost,
	grp.LastLandedCost as ActualLandedCost,
	rp.CashPrice as UnitPrice,
	gr.CreatedDate,
	gr.LocationId
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
INNER JOIN merchandising.CurrentStockPriceByLocationView rp
	ON rp.ProductId = pop.ProductId
	AND rp.locationid = gr.LocationId
INNER JOIN Merchandising.Product p
	ON p.Id = pop.ProductId
WHERE gr.CostConfirmed IS NOT NULL
	AND p.ProductType IN ('ProductWithoutStock', 'RegularStock')
