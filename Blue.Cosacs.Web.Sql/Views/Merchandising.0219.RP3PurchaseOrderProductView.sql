IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.[RP3PurchaseOrderProductView]'))
	DROP VIEW Merchandising.[RP3PurchaseOrderProductView]
GO

CREATE VIEW [Merchandising].[RP3PurchaseOrderProductView]
AS

SELECT
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY po.Id)) AS Id,
	po.Id AS PONumber,
	pop.Sku AS ProductCode,
	CONVERT(INT, ROW_NUMBER() OVER (PARTITION BY po.Id ORDER BY po.Id)) AS LineNumber,
	pop.QuantityOrdered AS UnitsOrdered,
	SUM(ISNULL(grp.QuantityReceived, 0)) AS UnitsReceived,
	ISNULL(pop.UnitCost, 0) AS SupplierUnitCost,
	ISNULL(po.Currency, s.Currency) AS SupplierCurrency,
	ISNULL(pop.PreLandedUnitCost, 0) AS PreLandedUnitCost,
	ISNULL(cp.LastLandedCost, 0) AS ActualLandedUnitCost,
	ISNULL(rp.CashPrice, 0) AS UnitPrice,
	pop.UnitCost * pop.QuantityOrdered AS SubTotal,
	po.CreatedDate
FROM Merchandising.PurchaseOrderProduct pop
INNER JOIN Merchandising.PurchaseOrder po
	ON pop.PurchaseOrderId = po.Id
	AND po.status NOT IN ('Completed', 'Cancelled')
INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
	ON rp.ProductId = pop.ProductId
	AND rp.LocationId = po.ReceivingLocationId
INNER JOIN Merchandising.CurrentCostPriceView cp
	ON cp.ProductId = pop.ProductId
INNER JOIN Merchandising.Product p
	ON p.Id = cp.ProductId
LEFT JOIN Merchandising.GoodsReceiptProduct grp
	ON grp.PurchaseOrderProductId = pop.Id
LEFT JOIN Merchandising.Supplier s
	ON s.Id = po.VendorId
WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
GROUP BY po.Id,
	     pop.Sku,
         pop.QuantityOrdered,
         ISNULL(pop.UnitCost, 0),
         ISNULL(po.Currency, s.Currency),
         ISNULL(pop.PreLandedUnitCost, 0),
         ISNULL(cp.LastLandedCost, 0),
         ISNULL(rp.CashPrice, 0),
         pop.UnitCost * pop.QuantityOrdered,
         po.CreatedDate