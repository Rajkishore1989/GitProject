IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SetProductView]'))
DROP VIEW  [Merchandising].[SetProductView]
GO

CREATE VIEW [Merchandising].[SetProductView]
AS

WITH tax(EffectiveDate, ProductId, Rate, rowid)
AS
(
	SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER () OVER (PARTITION BY t.ProductId ORDER BY t.EffectiveDate desc, Id desc) RowId
	FROM Merchandising.TaxRate t
	WHERE EffectiveDate <= GETDATE()
)
SELECT DISTINCT
	ISNULL(CONVERT(int, ROW_NUMBER() OVER(ORDER BY p.Id)), 0) as Id,
	s.Id AS SetProductId,
	p.Id AS ProductId,
	s.SetId,
	p.SKU,
	p.LongDescription,
	s.Quantity,
	rp.RegularPrice,
	rp.CashPrice,
	rp.DutyFreePrice,
	rp.LocationId,
	rp.Fascia,
	rp.EffectiveDate AS PriceEffectiveDate,
	COALESCE(tId.Rate, t.Rate, 0) AS TaxRate,
	cco.SupplierCost,
	cco.AverageWeightedCost,
	cco.LastLandedCost,
	cco.SupplierCurrency,
	l.Name AS LocationName
FROM [Merchandising].SetProduct s
INNER JOIN [Merchandising].Product p
	ON s.ProductId = p.Id
LEFT JOIN [Merchandising].RetailPrice rp
	ON p.Id = rp.ProductId
LEFT JOIN [Merchandising].Location l
	ON l.Id = rp.LocationId
LEFT JOIN Merchandising.CurrentCostPriceView cco
	ON p.Id = cco.ProductId
LEFT JOIN tax AS tId ON tId.ProductId = p.Id AND tId.rowid = 1
LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
WHERE s.Id IS NOT NULL
GO
