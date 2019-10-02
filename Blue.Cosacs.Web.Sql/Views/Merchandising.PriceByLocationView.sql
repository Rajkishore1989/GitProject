IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PriceByLocationView]'))
DROP VIEW [Merchandising].[PriceByLocationView]
GO

CREATE VIEW [Merchandising].[PriceByLocationView]
AS
 
SELECT 
	CONVERT(Int,ROW_NUMBER() OVER (ORDER BY productId, LocationId)) as Id,
	ProductId,
	LocationId,
	SalesId,
	RegularPrice,
	CashPrice,
	DutyFreePrice,
	TaxRate
FROM (
	SELECT 
		Product.Id as ProductId,
		Location.id as LocationId,
		Location.SalesId, 
		COALESCE(LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice) as RegularPrice, 
		COALESCE(LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice) as CashPrice, 
		COALESCE(LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice) as DutyFreePrice, 
		COALESCE(LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate) as TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	LEFT JOIN Merchandising.CurrentRetailPriceView LocationPrice 
		ON LocationPrice.ProductId = Product.Id 
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView	FasciaPrice 
		ON FasciaPrice.ProductId = Product.Id 
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView AllPrice 
		ON AllPrice.ProductId = Product.Id 
		AND AllPrice.Fascia IS NULL 
		AND AllPrice.LocationId IS NULL
	WHERE Product.ProductType NOT IN ('Set', 'Combo')

	UNION

	SELECT 
		Product.Id as ProductId,
		Location.id as LocationId,
		Location.SalesId, 
		COALESCE(LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice) as RegularPrice, 
		COALESCE(LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice)  as CashPrice, 
		COALESCE(LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice)  as DutyFreePrice, 
		COALESCE(LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate) as TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	INNER JOIN Merchandising.ComboProduct Component 
		ON Component.ComboId = Product.Id
	LEFT JOIN Merchandising.CurrentRetailPriceView LocationPrice 
		ON LocationPrice.ProductId = Product.Id 
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentLocationPrice 
		ON LocationPrice.ProductId = Component.ProductId 
		AND ComponentLocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView FasciaPrice 
		ON FasciaPrice.ProductId = Product.Id 
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentFasciaPrice 
		ON ComponentFasciaPrice.ProductId = Component.ProductId 
		AND ComponentFasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView AllPrice 
		ON AllPrice.ProductId = Product.Id 
		AND AllPrice.Fascia IS NULL 
		AND AllPrice.LocationId IS NULL
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentAllPrice 
		ON ComponentAllPrice.ProductId = Component.ProductId 
		AND ComponentAllPrice.Fascia IS NULL 
		AND ComponentAllPrice.LocationId IS NULL
	WHERE Product.ProductType = 'Combo'

	UNION 

	SELECT 
		Product.Id as ProductId, 
		Location.id as LocationId, 
		Location.SalesId, 
		COALESCE(LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice) as RegularPrice, 
		COALESCE(LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice) as CashPrice, 
		COALESCE(LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice) as DutyFreePrice, 
		COALESCE(LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate) as TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	INNER JOIN Merchandising.SetProduct Component 
		ON Component.SetId = Product.Id
	LEFT JOIN Merchandising.CurrentRetailPriceView LocationPrice 
		ON LocationPrice.ProductId = Product.Id 
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentLocationPrice 
		ON LocationPrice.ProductId = Component.ProductId 
		AND ComponentLocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView FasciaPrice 
		ON FasciaPrice.ProductId = Product.Id 
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentFasciaPrice 
		ON ComponentFasciaPrice.ProductId = Component.ProductId 
		AND ComponentFasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView AllPrice 
		ON AllPrice.ProductId = Product.Id 
		AND AllPrice.Fascia IS NULL 
		AND AllPrice.LocationId IS NULL
	LEFT JOIN Merchandising.CurrentRetailPriceView ComponentAllPrice 
		ON ComponentAllPrice.ProductId = Component.ProductId 
		AND ComponentAllPrice.Fascia IS NULL 
		AND ComponentAllPrice.LocationId IS NULL
	WHERE Product.ProductType = 'SET'
) as V

