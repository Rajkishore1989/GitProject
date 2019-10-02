IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentPriceByLocationView]'))
DROP VIEW  [Merchandising].[CurrentPriceByLocationView]
GO

CREATE VIEW [Merchandising].[CurrentPriceByLocationView]
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
FROM 
(
	SELECT 
		Product.Id as ProductId, 
		Location.Id as LocationId, 
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
	LEFT JOIN Merchandising.CurrentRetailPriceView FasciaPrice 
		ON FasciaPrice.ProductId = Product.Id 
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView AllPrice 
		ON AllPrice.ProductId = Product.Id 
		AND AllPrice.Fascia IS NULL 
		AND AllPrice.LocationId IS NULL
) as V

GO
