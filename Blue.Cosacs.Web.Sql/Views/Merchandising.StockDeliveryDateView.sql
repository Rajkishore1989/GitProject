IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockDeliveryDateView]'))
DROP VIEW  [Merchandising].[StockDeliveryDateView]
GO

create view [Merchandising].[StockDeliveryDateView] as
select
	 ISNULL(CONVERT(Int,ROW_NUMBER() OVER (ORDER BY pop.ProductId DESC)), 0) as Id
	,pop.ProductId
	,po.ReceivingLocationId
	,min(pop.EstimatedDeliveryDate) EstimatedDeliveryDate
from
	Merchandising.PurchaseOrder po
	join
	Merchandising.PurchaseOrderProduct pop on pop.PurchaseOrderId = po.Id
where
	pop.EstimatedDeliveryDate >= Convert(date, getutcdate())
group by
	pop.ProductId
	,po.ReceivingLocationId
	,pop.EstimatedDeliveryDate