IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.ProductsOnOrder'))
DROP VIEW Merchandising.ProductsOnOrder
GO

CREATE VIEW [Merchandising].ProductsOnOrder
AS
WITH GR
AS 
(
	SELECT SUM(rp.QuantityReceived + rp.QuantityCancelled) Received, PurchaseOrderProductId
	FROM Merchandising.GoodsReceiptProduct rp
	group by PurchaseOrderProductId
)
select po.Id PurchaseOrderId, ProductId,SUM(ISNULL(QuantityOrdered,0) - ISNULL(QuantityCancelled,0) - ISNULL(GR.Received,0)) OnOrder
from Merchandising.PurchaseOrder po
inner join Merchandising.PurchaseOrderproduct pop on pop.PurchaseOrderId = po.Id
LEFT JOIN GR on GR.PurchaseOrderProductId = pop.id
WHERE status IN ('New','PartiallyReceived','Expired')
group by ProductId, po.id