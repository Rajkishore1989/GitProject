IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PromotionReportView]'))
	DROP VIEW Merchandising.PromotionReportView
GO
CREATE VIEW Merchandising.PromotionReportView
AS

SELECT
	MAX(delivery.Id) as Id,
	Product.Id as ProductId,
	Product.Sku,
	Product.LongDescription,
	location.Id as LocationId,
	location.Fascia,
	location.Name as LocationName,
	Promotion.Id as PromotionId,
	Promotion.Name as PromotionName,
	promotion.StartDate as PromotionStartDate,
	SUM(Delivery.Quantity) as Quantity,
	SUM((Delivery.Quantity * Delivery.CashPrice) + Delivery.Discount) / NULLIF(SUM(Delivery.Quantity),0) as Price,
	SUM(Delivery.Discount) as Discount,
	SUM((Delivery.Quantity * Delivery.Price)) as GrossTotal,
	SUM((Delivery.Quantity * Delivery.CashPrice) + Delivery.Discount) as NetTotal,
	MAX(cost.AverageWeightedCost) as AverageWeightedCost,
	SUM(Delivery.Quantity * (Delivery.CashPrice - cost.AverageWeightedCost) + Delivery.Discount) AS PromotionalTotal,
	CASE 
		WHEN SUM(Delivery.CashPrice) <= 0 THEN 0
		ELSE SUM(Delivery.Quantity * (Delivery.CashPrice - cost.AverageWeightedCost) + Delivery.Discount)
			/ NULLIF(SUM((Delivery.Quantity * Delivery.CashPrice) + Delivery.Discount),0)
	END as PromotionalMargin
FROM Merchandising.CintOrder AS Delivery
INNER JOIN Merchandising.Location as Location
	ON location.Salesid = Delivery.SaleLocation
INNER JOIN Merchandising.Product AS product
	ON Delivery.Sku = product.SKU
	AND Delivery.[Type] IN ('Return', 'Delivery')
INNER JOIN Merchandising.CintOrder AS [Order]
	ON Delivery.Id != [Order].Id
	AND Delivery.PrimaryReference = [Order].PrimaryReference
	AND Delivery.StockLocation = [Order].StockLocation
	AND Delivery.Sku = [Order].Sku
	AND [Order].[Type] = 'RegularOrder'
	AND
	(
		(
			[Order].ReferenceType = 'invoice'
			AND [Order].SecondaryReference = Delivery.SecondaryReference
		)
		OR [Order].ReferenceType != 'invoice'
	)
	AND [Order].TransactionDate =
    (
		SELECT MAX(TransactionDate) AS Expr1
		FROM Merchandising.CintOrder AS LastOrder
		WHERE [Type] = 'RegularOrder'
			AND LastOrder.Sku = Delivery.Sku
			AND LastOrder.Id != Delivery.Id
			AND LastOrder.TransactionDate <= Delivery.TransactionDate
			AND LastOrder.PrimaryReference = Delivery.PrimaryReference
			AND LastOrder.StockLocation = Delivery.StockLocation
			AND
			(
				(
					LastOrder.ReferenceType = 'invoice'
					AND LastOrder.SecondaryReference = Delivery.SecondaryReference
				)
				OR LastOrder.ReferenceType != 'invoice'
			)
	)
INNER JOIN Merchandising.Promotion promotion
	ON [Order].PromotionId = promotion.Id
INNER JOIN Merchandising.CostPrice AS cost
	ON Product.Id = cost.ProductId
	AND cost.AverageWeightedCostUpdated =
	(
		SELECT MAX(lastcost.AverageWeightedCostUpdated)
		FROM Merchandising.CostPrice lastCost
		WHERE lastCost.productId = cost.ProductId
	)
GROUP BY
	Product.Id,
	Product.Sku,
	Product.LongDescription,
	location.Id,
	location.Fascia,
	location.Name,
	Promotion.Id,
	Promotion.Name,
	promotion.StartDate
