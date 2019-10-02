IF OBJECT_ID('Merchandising.ProductStockLevelsUpdateOnOrder') IS NOT NULL
	DROP PROCEDURE Merchandising.ProductStockLevelsUpdateOnOrder
GO 

CREATE PROCEDURE Merchandising.ProductStockLevelsUpdateOnOrder		
AS
BEGIN

;WITH GR
AS 
(
	SELECT 
		SUM(rp.QuantityReceived + rp.QuantityCancelled) Received, 
		PurchaseOrderProductId
	FROM Merchandising.GoodsReceiptProduct rp
	GROUP BY PurchaseOrderProductId
)

UPDATE p
SET StockOnOrder = 
	CASE 
		WHEN Totals.OnOrder < 0 THEN 0 
		ELSE ISNULL(Totals.OnOrder, 0) 
	END
FROM Merchandising.ProductStockLevel p
LEFT JOIN 
(
	SELECT
		SUM(ISNULL(QuantityOrdered, 0) - ISNULL(QuantityCancelled, 0) - ISNULL(GR.Received, 0)) OnOrder, 
		ProductId, 
		ReceivingLocationId 
	FROM Merchandising.PurchaseOrder po
	INNER JOIN Merchandising.PurchaseOrderproduct pop 
		ON pop.PurchaseOrderId = po.Id
	LEFT JOIN GR 
		ON GR.PurchaseOrderProductId = pop.id
	WHERE po.Status != 'Completed'
	GROUP BY 
		ProductId, 
		ReceivingLocationId
) AS Totals 
	ON p.LocationId = Totals.ReceivingLocationId 
	AND p.ProductId = Totals.ProductId

END