-- transaction: true
-- Change the previous line to false to disable running this whole migration in one transaction.
-- Removing that first line will default to 'true'.
-- 
-- Put your SQL code here
IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.[ComboPriceView]'))
DROP VIEW Merchandising.[ComboPriceView]
GO

CREATE VIEW [Merchandising].[ComboPriceView]
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
	cpp.*,
	cp.ProductId,
	cp.Quantity,
	COALESCE(cpp.fascia, l.Name) AS LocationName,
	SUM(s.StockAvailable) as StockAvailable,	
	c.Id AS ComboId,
	COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
FROM [Merchandising].ComboProductPrice cpp
INNER JOIN [Merchandising].ComboProduct cp 
	ON cpp.ComboProductId = cp.Id
INNER JOIN [Merchandising].Combo c 
	ON c.Id = cp.ComboId
LEFT JOIN [Merchandising].Location l 
	ON l.Id = cpp.LocationId 
	OR l.Fascia = cpp.Fascia
LEFT JOIN Merchandising.ProductStockLevel s 
	ON s.productid = cp.ProductId
	AND l.id = s.locationId
LEFT JOIN tax AS tId
	ON tId.ProductId = cp.ProductId
    AND tId.EffectiveDate <= c.StartDate
LEFT JOIN tax AS t
	ON t.ProductId IS NULL
	AND t.EffectiveDate <= c.StartDate
GROUP BY 
	cpp.Id,
	ComboProductId,
	cpp.LocationId,
	RegularPrice,
	CashPrice,
	DutyFreePrice,
	cpp.Fascia,
	cp.ProductId,
	cp.Quantity,
	COALESCE(tId.Rate, t.Rate, 0),
	COALESCE(cpp.fascia, l.Name),
	c.Id

GO
