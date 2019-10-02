IF EXISTS (SELECT * FROM sys.views where name = 'CintDeliveryPriceView')
	DROP VIEW [Merchandising].[CintDeliveryPriceView]
GO

CREATE VIEW [Merchandising].[CintDeliveryPriceView]
AS

SELECT
	co.Id,
	co.RunNo,
	co.[Type],
	co.PrimaryReference,
	co.SaleType,
	co.SaleLocation,
	co.Sku,
	co.ProductId,
	co.StockLocation,
	co.ParentSku,
	co.ParentId,
	co.TransactionDate,
	co.Quantity,
	co2.Price,
	co.Tax,
	co.SecondaryReference,
	co.ReferenceType,
	co.Discount,
	co2.CashPrice,
	co2.PromotionId
FROM Merchandising.CintOrder co
INNER JOIN Merchandising.CintOrder AS co2
	ON co.PrimaryReference = co2.PrimaryReference
	AND co.StockLocation = co2.StockLocation
	AND co.Sku = co2.Sku
	AND co2.Type = 'RegularOrder'
	AND 
	(
		co2.SecondaryReference = co.SecondaryReference
		OR co2.ReferenceType <> 'invoice'
	)
	AND co2.TransactionDate = 
	(
		SELECT MAX(co3.TransactionDate)
		FROM Merchandising.CintOrder AS co3
		WHERE co3.Type = 'RegularOrder'
			AND co3.PrimaryReference = co.PrimaryReference
			AND co3.StockLocation = co.StockLocation	
			AND co3.Sku = co.Sku
			AND 
			(
				co3.SecondaryReference = co.SecondaryReference
				OR co3.ReferenceType <> 'invoice'
			)
	)
WHERE co.type IN ('delivery', 'return', 'repossession', 'redelivery')