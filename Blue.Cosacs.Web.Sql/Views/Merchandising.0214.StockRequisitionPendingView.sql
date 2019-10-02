IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockRequisitionPendingView]'))
DROP VIEW  [Merchandising].[StockRequisitionPendingView]
GO

create view [Merchandising].[StockRequisitionPendingView] as
select 
	ProductId, ReceivingLocationId, sum(Quantity - QuantityCancelled - QuantityReceived) as QuantityPending
from
	Merchandising.StockRequisitionProduct 
Group by ProductId, ReceivingLocationId
	

	