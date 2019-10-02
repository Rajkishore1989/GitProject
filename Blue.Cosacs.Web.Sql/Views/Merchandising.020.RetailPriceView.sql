IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RetailPriceView]'))
	DROP VIEW [Merchandising].[RetailPriceView]
GO

CREATE VIEW [Merchandising].[RetailPriceView]
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
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY productid DESC)) AS Id,
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
		rp.LocationId,
		rp.ProductId,
		rp.EffectiveDate,
		rp.RegularPrice,
		rp.CashPrice,
		rp.DutyFreePrice,
		rp.Fascia,
		COALESCE(tId.Rate, t.Rate, 0) AS TaxRate,
		l.Name
	FROM [Merchandising].[RetailPrice] rp
	LEFT JOIN [Merchandising].[Location] l
		ON rp.LocationId = l.id 
	LEFT JOIN tax AS tId
		ON tId.ProductId = rp.ProductId
		AND tId.EffectiveDate <= rp.EffectiveDate 
    LEFT JOIN tax AS t
		ON t.ProductId IS NULL
		AND t.EffectiveDate <= rp.EffectiveDate
		
	UNION 
	
	--Sets
	SELECT
		s.LocationId,
		s.SetId AS ProductId,
		s.EffectiveDate,
		s.regularPrice,
		s.CashPrice,
		s.DutyFreePrice,
		s.Fascia,
		((SUM(sp.cashprice * sp.quantity * (1 + sp.TaxRate)) - SUM(sp.cashprice * sp.quantity)) /
		CASE SUM(sp.cashprice * sp.quantity)
			WHEN 0 THEN 1
			ELSE SUM(sp.cashprice * sp.quantity)
		END) AS TaxRate,
		l.Name AS Name
	FROM Merchandising.SetLocationView s
	INNER JOIN Merchandising.Setproductview sp
		ON sp.SetId = s.SetId
		AND ISNULL(sp.LocationId, 0) = ISNULL(s.LocationId, 0) 
		AND ISNULL(sp.Fascia, '') = ISNULL(s.Fascia, '') 
	INNER JOIN Merchandising.Product p
		ON p.id = s.SetId
	LEFT JOIN Merchandising.Location l
		ON l.id = s.LocationId
	GROUP BY s.LocationId, s.SetId, s.regularPrice, s.CashPrice, s.DutyFreePrice, s.Fascia, l.Name, s.effectiveDate
	
	UNION 
	
	--Combos
	SELECT
		c.LocationId,
		c.ComboId AS ProductId,
		CAST(cp.StartDate as Date) AS EffectiveDate,
		SUM(regularPrice * quantity) AS RegularPrice,
		SUM(cashprice * quantity) AS CashPrice,
		SUM(dutyfreeprice * quantity) AS DutyFreePrice,
		c.Fascia,
		((SUM(cashprice * quantity * (1 + c.TaxRate)) - SUM(cashprice * quantity)) /
		CASE SUM(cashprice * quantity)
			WHEN 0 THEN 1
			ELSE SUM(cashprice * quantity)
		END) AS TaxRate,
		l.Name AS Name
	FROM Merchandising.ComboPriceView c
	INNER JOIN merchandising.combo cp
		ON cp.id = c.ComboId
	INNER JOIN Merchandising.Product p
		ON p.id = c.comboid
	LEFT JOIN Merchandising.Location l
		ON l.id = c.LocationId
	GROUP BY 
		c.LocationId, 
		c.ComboId, 
		c.Fascia, 
		l.Name, 
		cp.StartDate
) AS pview

GO