-- If you make chages to this view please also add to [Merchandising].[PendingStockOnOrderView]

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