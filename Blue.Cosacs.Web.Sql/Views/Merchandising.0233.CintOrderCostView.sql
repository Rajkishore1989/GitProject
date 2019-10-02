IF  NOT OBJECT_ID('Merchandising.CintOrderCostView') IS NULL
	DROP VIEW  [Merchandising].[CintOrderCostView]
GO

CREATE VIEW [Merchandising].[CintOrderCostView]
AS
	SELECT DISTINCT 
		c.Id,c.RunNo,
		c.[Type],
		c.PrimaryReference,
		c.SaleType,c.SaleLocation,
		p.Sku,c.StockLocation,
		c.ParentSku,
		c.TransactionDate,
		c.Quantity,
		c.Price,
		c.Tax,
		c.SecondaryReference,
		c.ReferenceType,
		c.Discount, 
		COALESCE(co.CashPrice, c.CashPrice, c.price) as CashPrice, 
		p.id as ProductId, 
		pp.Id as ParentId, 
		stockloc.id as StockLocationId, 
		salesLoc.Id as SalesLocationId, 
		cp.AverageWeightedCost, 
		ISNULL(co.PromotionId, c.promotionId) as PromotionId
	FROM
		Merchandising.CintOrder c
		INNER JOIN Merchandising.Product p 
			on p.sku = c.Sku
		INNER JOIN Merchandising.Location stockloc 
			on stockloc.salesId = c.StockLocation
		INNER JOIN Merchandising.Location salesloc 
			on salesloc.salesId = c.SaleLocation
		LEFT JOIN Merchandising.Product pp 
			on pp.sku = c.ParentSku
		LEFT JOIN merchandising.costprice cp 
			on cp.productId = p.id 
			and cp.Id = (SELECT MAX(Id)
						 FROM merchandising.costprice cp2
						 WHERE cp2.productid = cp.productid 
                            AND cp2.AverageWeightedCostUpdated <= c.TransactionDate)
		LEFT JOIN Merchandising.CintOrder AS co 
			ON c.CintRegularOrderId = co.Id
			AND co.[Type] = 'RegularOrder' 
			AND c.[Type] in ('Delivery', 'Return', 'Repossession')
