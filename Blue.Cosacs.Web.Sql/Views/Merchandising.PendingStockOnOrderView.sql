IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PurchaseOrderProductStatsView]'))
DROP VIEW  [Merchandising].[PurchaseOrderProductStatsView]
GO

create view [Merchandising].[PurchaseOrderProductStatsView] as
select
	pop.Id
   ,pop.QuantityOrdered - sum(ISNULL(rp.QuantityReceived,0) + ISNULL(rp.QuantityCancelled,0)) - ISNULL(pop.QuantityCancelled,0) as 'QuantityPending'
   ,sum(ISNULL(rp.QuantityCancelled,0)) + ISNULL(pop.QuantityCancelled,0) as 'QuantityCancelled'
   ,sum(ISNULL(rp.QuantityReceived,0)) as 'QuantityReceived'
from
	Merchandising.PurchaseOrderProduct pop
	left join
	Merchandising.GoodsReceiptProduct rp on rp.PurchaseOrderProductId = pop.Id
group by
	pop.Id
   ,pop.QuantityOrdered
   ,pop.QuantityCancelled
GO


IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PendingStockOnOrderView]'))
	DROP VIEW [Merchandising].[PendingStockOnOrderView]
GO

CREATE VIEW Merchandising.PendingStockOnOrderView
AS

SELECT pop.id,
       po.id AS PurchaseOrderId,
       pop.ProductId,
       po.ReceivingLocationId AS LocationId, 
       ISNULL(pop.EstimatedDeliveryDate, pop.RequestedDeliveryDate) AS DeliveryDate,
	   SUM(COALESCE(pops.QuantityPending, (pop.QuantityOrdered - pop.QuantityCancelled), 0)) AS PendingStock
FROM Merchandising.PurchaseOrder po
INNER JOIN Merchandising.PurchaseOrderProduct pop
ON po.Id = pop.PurchaseOrderId
LEFT JOIN Merchandising.PurchaseOrderProductStatsView pops
ON pop.Id = pops.Id
WHERE po.[Status] NOT IN ('Cancelled', 'Completed')
GROUP BY pop.id,
         po.id,
         pop.ProductId,
         po.ReceivingLocationId, 
         ISNULL(pop.EstimatedDeliveryDate, pop.RequestedDeliveryDate)
GO