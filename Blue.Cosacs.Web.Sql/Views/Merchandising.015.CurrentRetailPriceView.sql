IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentRepossessedRetailPriceView]'))
	DROP VIEW [Merchandising].[CurrentRepossessedRetailPriceView]
GO

CREATE VIEW [Merchandising].[CurrentRepossessedRetailPriceView]
AS

WITH Tax(ProductId, LocationId, Fascia, EffectiveDate)
AS (
	SELECT p.ProductId, 
           p.LocationId, 
           p.Fascia, 
           MAX(EffectiveDate) AS EffectiveDate
		   FROM [Merchandising].[RepossessedPriceView] p
		   WHERE EffectiveDate <= GETDATE()
           GROUP BY p.ProductId, 
               p.LocationId, 
               p.Fascia
   )

SELECT Id, LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
FROM (
	SELECT
		rp.ProductId as Id,
		rp.LocationId,
		rp.ProductId,
		rp.EffectiveDate,
		rp.RegularPrice,
		rp.CashPrice,
		rp.DutyFreePrice,
		rp.Fascia,
		rp.TaxRate AS TaxRate,
		rp.Name
	FROM Merchandising.[RepossessedPriceView] rp
	INNER JOIN Tax 
	ON Tax.ProductId = rp.ProductId
	AND 
	(
		Tax.LocationId = rp.LocationId 
		OR Tax.LocationId IS NULL
	)
	AND ISNULL(Tax.Fascia, '') = ISNULL(rp.Fascia, '')
	AND Tax.EffectiveDate = rp.EffectiveDate
	AND Tax.EffectiveDate = Tax.EffectiveDate
	LEFT JOIN Merchandising.Location l
		ON rp.LocationId = l.id
) as RPView

GO

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentSetRetailPriceView]'))
DROP VIEW  [Merchandising].[CurrentSetRetailPriceView]
GO

CREATE VIEW [Merchandising].[CurrentSetRetailPriceView]
AS

SELECT
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY productid DESC)) as Id,
	LocationId,
	ProductId,
	EffectiveDate,
	RegularPrice,
	CashPrice,
	DutyFreePrice,
	Fascia,
	TaxRate,
	Name
FROM
(
	SELECT
		s.LocationId,
		s.SetId as ProductId,
		s.EffectiveDate as EffectiveDate,
		s.regularPrice, s.CashPrice, s.DutyFreePrice,
		s.Fascia,
		SUM(CAST(sp.cashprice * sp.quantity * sp.TaxRate AS DECIMAL(38,18))) /
			CASE SUM(sp.cashprice * sp.quantity)
				WHEN 0 THEN 1
				ELSE SUM(sp.cashprice * sp.quantity)
			END
		as TaxRate,
		l.Name as Name
	FROM Merchandising.SetLocationView s
	INNER JOIN Merchandising.Setproductview sp
		ON sp.SetId = s.SetId
		AND ISNULL(sp.LocationId, '') = ISNULL(s.LocationId, '')
		AND ISNULL(sp.Fascia, '') = ISNULL(s.Fascia, '')
	INNER JOIN merchandising.CurrentStockRetailPriceView csp
		on csp.EffectiveDate = sp.PriceEffectiveDate
		AND csp.ProductId = sp.ProductId
		AND ISNULL(csp.LocationId, '') = ISNULL(sp.LocationId, '')
		AND ISNULL(csp.Fascia, '') = ISNULL(sp.Fascia, '')
	INNER JOIN Merchandising.Product p
		ON p.id = s.SetId
	INNER JOIN
	(
		SELECT
			SetId,
			Locationid,
			Fascia,
			MAX(EffectiveDate) as EffectiveDate
		FROM [Merchandising].SetLocationView p
		WHERE EffectiveDate <= GETDATE()
		GROUP BY
			Setid,
			Locationid,
			Fascia
	) AS CurrentPrice
		ON CurrentPrice.SetId = s.SetId
		AND
		(
			CurrentPrice.LocationId = s.LocationId
			OR CurrentPrice.LocationId IS NULL
		)
		AND
		(
			CurrentPrice.Fascia = s.Fascia
			OR CurrentPrice.Fascia IS NULL
		)
		AND CurrentPrice.EffectiveDate = s.EffectiveDate
	LEFT JOIN Merchandising.Location l
		ON l.id = s.LocationId
	GROUP BY
		s.LocationId,
		s.SetId,
		s.regularPrice,
		s.CashPrice,
		s.DutyFreePrice,
		s.Fascia,
		l.Name,
		s.Effectivedate
) AS rp

GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentComboRetailPriceView]'))
DROP VIEW  [Merchandising].[CurrentComboRetailPriceView]
GO

CREATE VIEW [Merchandising].[CurrentComboRetailPriceView]
AS

SELECT
	CONVERT(Int,ROW_NUMBER() OVER (ORDER BY productid DESC)) as Id,
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
		c.LocationId,
		c.ComboId as ProductId,
		CONVERT(date, co.StartDate) as EffectiveDate,
		SUM(regularPrice * quantity) as RegularPrice,
		SUM(cashprice * quantity) as CashPrice,
		SUM(dutyfreeprice * quantity) as DutyFreePrice,
		c.Fascia,
		(
			(SUM(cashprice * quantity * (1 + c.TaxRate)) - SUM(cashprice * quantity))
			/ CASE SUM(cashprice * quantity)
				WHEN 0 THEN 1
				ELSE SUM(cashprice * quantity)
			END
			) as TaxRate,
		l.Name as Name
	FROM Merchandising.ComboPriceView c
	INNER JOIN Merchandising.Combo co
		ON co.Id = c.ComboId
	INNER JOIN Merchandising.Product p
		ON p.id = c.comboid
	LEFT JOIN Merchandising.Location l
		ON l.id = c.LocationId
	GROUP BY
		c.LocationId,
		c.ComboId,
		c.Fascia,
		l.Name,
		co.StartDate
) as RPView

GO

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentRetailPriceView]'))
DROP VIEW  [Merchandising].[CurrentRetailPriceView]
GO

CREATE VIEW [Merchandising].[CurrentRetailPriceView]
AS

SELECT CONVERT(INT, ROW_NUMBER() OVER (ORDER BY productid DESC)) as Id, LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
FROM (
	SELECT LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
	FROM Merchandising.CurrentStockRetailPriceView
	UNION
	SELECT LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
	FROM Merchandising.[CurrentRepossessedRetailPriceView]
	UNION
	SELECT LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
	FROM Merchandising.CurrentSetRetailPriceView
	UNION
	SELECT LocationId, ProductId, EffectiveDate, RegularPrice, CashPrice, DutyFreePrice, Fascia, TaxRate, Name
	FROM Merchandising.CurrentComboRetailPriceView
) as RPVIEW

GO