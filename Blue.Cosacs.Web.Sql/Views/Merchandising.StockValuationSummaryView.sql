IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockValuationSummaryView]'))
DROP VIEW  [Merchandising].StockValuationSummaryView
GO

create view [Merchandising].StockValuationSummaryView 
as

SELECT DISTINCT stock.Id, stock.ProductId,stock.LocationId
	,StockOnHand as StockOnHandQuantity
	,ISNULL(StockOnHand * isnull(AverageWeightedCost, 0),0) as StockOnHandValue
	,ISNULL(StockOnHand * isnull(retail.CashPrice,0),0) as StockOnHandSalesValue,
	isnull(retail.CashPrice,0) as CashPrice
FROM Merchandising.ProductStockLevel stock
inner join Merchandising.Product product 
	on product.id = stock.ProductId
inner join Merchandising.ProductStatus [status] 
	on product.[status] = [status].id
inner join Merchandising.CurrentStockPriceByLocationView retail 
	on retail.ProductId = stock.productid
	and retail.LocationId = stock.LocationId
	and isnull(StockOnHand, 0) != 0
Inner join merchandising.Location location 
	on location.Id = stock.locationId
	and (
		product.storetypes like '%"' + location.storetype + '"%' 
		OR product.storetypes is null 
		OR product.storetypes = '[]'
		)
inner join Merchandising.CurrentCostPriceView cost 
	on cost.ProductId = stock.ProductId
	and cost.AverageWeightedCost is not null