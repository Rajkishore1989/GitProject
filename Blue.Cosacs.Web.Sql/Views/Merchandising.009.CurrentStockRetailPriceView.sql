IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentStockRetailPriceView]'))
DROP VIEW  [Merchandising].[CurrentStockRetailPriceView]
GO

CREATE VIEW [Merchandising].[CurrentStockRetailPriceView]
AS

WITH tax(EffectiveDate, ProductId, Rate, [row])
AS
(
	SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER () OVER (PARTITION BY t.ProductId ORDER BY t.EffectiveDate desc, Id desc) [Row]
	FROM Merchandising.TaxRate t
	WHERE EffectiveDate <= GETDATE()
)
SELECT 
	Id, 
	LocationId, 
	ProductId, 
	EffectiveDate, 
	RegularPrice, 
	CashPrice, 
	DutyFreePrice, 
	Fascia, 
	TaxRate, 
	Name
FROM (
	SELECT
		rp.Id,
		rp.LocationId,
		rp.ProductId,
		rp.EffectiveDate,
		rp.RegularPrice,
		rp.CashPrice,
		rp.DutyFreePrice,
		rp.Fascia,
		COALESCE(tId.Rate, mt.Rate, 0) AS TaxRate,
		l.Name
	FROM [Merchandising].[RetailPrice] rp
	INNER JOIN Merchandising.Product p
		ON p.Id = rp.ProductId
		AND p.ProductType not in ('Combo', 'Set')
	INNER JOIN (
		SELECT Productid, Locationid, Fascia, max(EffectiveDate) as EffectiveDate
		FROM [Merchandising].retailprice p
		WHERE EffectiveDate <= GETDATE()
		GROUP BY Productid, Locationid, Fascia
	) AS CurrentPrice
		ON CurrentPrice.ProductId = rp.ProductId
		AND ISNULL(CurrentPrice.LocationId, 0) = ISNULL(rp.LocationId, 0)
		AND ISNULL(CurrentPrice.Fascia, 'none') = ISNULL(rp.Fascia, 'none')
		AND CurrentPrice.EffectiveDate = rp.EffectiveDate
	LEFT JOIN [Merchandising].[Location] l
		ON rp.LocationId = l.id
	LEFT JOIN tax AS tId ON tId.ProductId = p.Id AND tId.[row] = 1
    LEFT JOIN tax AS mt ON  mt.ProductId IS NULL  AND mt.[Row] = 1
) as RPView

GO