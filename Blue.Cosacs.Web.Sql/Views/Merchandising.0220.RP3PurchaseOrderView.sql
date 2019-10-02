IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3PurchaseOrderView]'))
	DROP VIEW [Merchandising].[RP3PurchaseOrderView]
GO

CREATE VIEW [Merchandising].[RP3PurchaseOrderView] 
AS

SELECT 
	po.Id, 
	po.Id as PONumber, 
	s.code as VendorCode,
	po.vendor as VendorName, 
	l.SalesId as ReceivingLocationCode, 
	po.ReceivingLocation as ReceivingLocationName, 
	po.Status as POStatus, 
	s.Type as POType,
    po.CreatedDate as TransactionDate, 
    po.RequestedDeliveryDate as ExpectedDeliveryDate, 
    ISNULL(po.CorporatePoNumber, 0) as CorporatePONumber, 
    po.ReferenceNumbers, 
    purchaseOrderTotal.Total as SubTotal
FROM Merchandising.PurchaseOrder po
INNER JOIN Merchandising.Supplier s
	ON po.VendorId = s.id
INNER JOIN Merchandising.Location l
	ON po.ReceivingLocationId = l.Id
INNER JOIN (
	SELECT 
		pop.PurchaseOrderId, 
		SUM(pop.UnitCost * pop.QuantityOrdered) as Total 
	FROM Merchandising.PurchaseOrderProduct pop
	INNER JOIN Merchandising.Product p
		ON p.Id = pop.ProductId
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
	GROUP BY PurchaseOrderId
) purchaseOrderTotal
	ON po.id = purchaseOrderTotal.PurchaseOrderId
WHERE po.Status NOT IN ('Completed', 'Cancelled')
