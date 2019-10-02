IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.[ComboProductView]'))
DROP VIEW Merchandising.[ComboProductView]
GO

CREATE VIEW [Merchandising].[ComboProductView]
AS

WITH tax(EffectiveDate, ProductId, Rate)
AS
(
	SELECT distinct t.EffectiveDate, t.ProductId, t.Rate
	FROM Merchandising.TaxRate t
	WHERE t.EffectiveDate = (
		SELECT MAX(EffectiveDate)
		FROM Merchandising.TaxRate
		WHERE ISNULL(ProductId, 0) = ISNULL(t.ProductId, 0)
			AND EffectiveDate <= GETDATE()
	)
)

SELECT
	ISNULL(CONVERT(int, ROW_NUMBER() OVER(ORDER BY c.Id)),0) as Id,
	c.Id AS ComboProductId,
	c.ProductId,
	c.ComboId,
	p.SKU,
	p.LongDescription,
	c.Quantity,
	sum(s.StockAvailable) as StockAvailable,
	rp.LocationId,
	rp.Fascia,
	rp.RegularPrice,
	rp.CashPrice,
	rp.DutyFreePrice,
	cc.SupplierCost,
	cc.SupplierCurrency,
	cc.AverageWeightedCost,
	COALESCE(rp.fascia, l.Name) AS LocationName,
	rp.EffectiveDate AS PriceEffectiveDate,
	COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
FROM [Merchandising].Combo co
INNER JOIN [Merchandising].ComboProduct c
	ON c.ComboId = co.Id
INNER JOIN [Merchandising].Product p
	ON c.ProductId = p.Id
LEFT JOIN [Merchandising].RetailPriceView rp
	ON rp.ProductId = p.Id
LEFT JOIN [Merchandising].Location l
	ON (rp.LocationId = l.Id OR rp.Fascia = l.Fascia)
LEFT JOIN Merchandising.CurrentStockAWCPriceView cc
	ON p.Id = cc.ProductId
LEFT JOIN [Merchandising].ProductStockLevel s
	ON s.ProductId = p.id
	AND s.LocationId = l.id
LEFT JOIN tax AS tId
	ON tId.ProductId = p.Id
    AND tId.EffectiveDate <= co.StartDate
LEFT JOIN tax AS t
	ON t.ProductId IS NULL
	AND t.EffectiveDate <= co.StartDate
GROUP BY
	c.Id,
	c.ProductId,
	c.ComboId,
	p.SKU,
	p.LongDescription,
	c.Quantity,
	rp.LocationId,
	rp.Fascia,
	rp.RegularPrice,
	rp.CashPrice,
	rp.DutyFreePrice,
	cc.SupplierCost,
	cc.SupplierCurrency,
	cc.AverageWeightedCost,
	COALESCE(rp.fascia, l.Name),
	rp.EffectiveDate,
	COALESCE(tId.Rate, t.Rate, 0),
	rp.productid,
	co.StartDate
GO
