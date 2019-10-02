IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductLastReceivedView]'))
DROP VIEW  [Merchandising].[ProductLastReceivedView]
GO

create view [Merchandising].[ProductLastReceivedView]
as
--Regular Stock
select p.Id as ProductId, max(gr.DateReceived) as DateLastReceived
from merchandising.product p
INNER JOIN  Merchandising.PurchaseOrderProduct pop
	on pop.productid = p.id
INNER join merchandising.goodsreceiptproduct grp
	on pop.Id = grp.purchaseorderproductid
INNER JOIN Merchandising.GoodsReceipt gr 
	on gr.Id = grp.GoodsReceiptId
group by  p.Id

UNION
--Spare Parts

select p.Id as ProductId, max(gr.DateReceived) as DateLastReceived
from merchandising.product p
INNER join merchandising.goodsreceiptdirectproduct grp
	on grp.ProductId = p.Id
INNER JOIN Merchandising.goodsreceiptdirect gr 
	on gr.Id = grp.GoodsReceiptDirectId
group by  p.Id
