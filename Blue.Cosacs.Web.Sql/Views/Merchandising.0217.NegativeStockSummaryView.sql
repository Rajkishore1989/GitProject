IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[NegativeStockSummaryView]'))
DROP VIEW  [Merchandising].NegativeStockSummaryView
GO

create view [Merchandising].NegativeStockSummaryView 
as

SELECT DISTINCT stock.Id, stock.ProductId,stock.LocationId
	,StockOnHand as StockOnHandQuantity
	,AverageWeightedCost
	,isnull(StockOnHand * AverageWeightedCost, 0) as StockOnHandValue
	,isnull(StockOnHand * retail.CashPrice,0) as StockOnHandSalesValue
FROM Merchandising.ProductStockLevel stock
inner join Merchandising.Product product 
	on product.id = stock.ProductId
inner join Merchandising.ProductStatus [status] 
	on product.[status] = [status].id
inner join Merchandising.Location location 
	on location.id = stock.locationid
inner join Merchandising.CurrentStockPriceByLocationView retail 
	on retail.ProductId = stock.productid
	and retail.LocationId = stock.LocationId
inner join Merchandising.CurrentCostPriceView cost 
	on cost.ProductId = stock.ProductId
Where  StockOnHand < 0