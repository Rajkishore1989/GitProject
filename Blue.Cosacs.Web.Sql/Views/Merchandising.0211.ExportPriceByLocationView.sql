IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ExportPriceByLocationView]'))
	DROP VIEW [Merchandising].[ExportPriceByLocationView]
GO

CREATE VIEW [Merchandising].[ExportPriceByLocationView]
AS

WITH tax(EffectiveDate, ProductId, Rate, RowId)  
AS  
(  
 SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY EffectiveDate DESC) RowID 
 FROM Merchandising.TaxRate t  
 WHERE t.EffectiveDate <= GETDATE()  
)
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
		Location.Id as LocationId,
		Location.SalesId,
		COALESCE(LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice) as RegularPrice,
		COALESCE(LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice) as CashPrice,
		COALESCE(LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice) as DutyFreePrice,
		COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	LEFT JOIN Merchandising.CurrentRetailPriceView as LocationPrice
		ON LocationPrice.ProductId = Product.Id
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentRetailPriceView as FasciaPrice
		ON FasciaPrice.ProductId = Product.Id
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRetailPriceView as AllPrice
		ON AllPrice.ProductId = Product.Id
		AND AllPrice.Fascia IS NULL
		AND AllPrice.LocationId IS NULL
	LEFT JOIN tax AS tId ON tId.ProductId = Product.Id AND tId.rowid = 1
	LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
	WHERE Product.ProductType NOT IN ('Set', 'Combo')

	UNION ALL

	SELECT
		Product.Id as ProductId,
		Location.Id as LocationId,
		Location.SalesId,
		COALESCE(
			LocationPrice.RegularPrice - SUM(ComponentLocationPrice.RegularPrice * Component.Quantity),
			FasciaPrice.RegularPrice - SUM(ComponentFasciaPrice.RegularPrice * Component.Quantity),
			AllPrice.RegularPrice - SUM(ComponentAllPrice.RegularPrice * Component.Quantity)
		) as RegularPrice,
		COALESCE(
			LocationPrice.CashPrice - SUM(ComponentLocationPrice.CashPrice * Component.Quantity),
			FasciaPrice.CashPrice - SUM(ComponentFasciaPrice.CashPrice * Component.Quantity),
			AllPrice.CashPrice - SUM(ComponentAllPrice.CashPrice * Component.Quantity)
		) as CashPrice,
		COALESCE(
			LocationPrice.DutyFreePrice - SUM(ComponentLocationPrice.DutyFreePrice * Component.Quantity),
			FasciaPrice.DutyFreePrice - SUM(ComponentFasciaPrice.DutyFreePrice * Component.Quantity),
			AllPrice.DutyFreePrice - SUM(ComponentAllPrice.DutyFreePrice * Component.Quantity)
		) as DutyFreePrice,
		COALESCE(LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate, 0) as TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	INNER JOIN Merchandising.ComboProduct Component
		ON Component.ComboId = Product.Id
	LEFT JOIN Merchandising.CurrentComboRetailPriceView as LocationPrice
		ON LocationPrice.ProductId = Product.Id
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentStockRetailPriceView as ComponentLocationPrice
		ON LocationPrice.ProductId = Component.ProductId
		AND ComponentLocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentComboRetailPriceView as FasciaPrice
		ON FasciaPrice.ProductId = Product.Id
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentStockRetailPriceView as ComponentFasciaPrice
		ON ComponentFasciaPrice.ProductId = Component.ProductId
		AND ComponentFasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentComboRetailPriceView as AllPrice
		ON AllPrice.ProductId = Product.Id
		AND AllPrice.Fascia IS NULL
		AND AllPrice.LocationId IS NULL
	LEFT JOIN Merchandising.CurrentStockRetailPriceView as ComponentAllPrice
		ON ComponentAllPrice.ProductId = Component.ProductId
		AND ComponentAllPrice.Fascia IS NULL
		AND ComponentAllPrice.LocationId IS NULL
	WHERE Product.ProductType IN ('Combo')
	GROUP BY
		Product.Id,
		Location.Id, Location.SalesId,
		LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice,
		LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice,
		LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice,
		LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate

	UNION ALL

	SELECT
		Product.Id as ProductId,
		Location.Id as LocationId,
		Location.SalesId,
		COALESCE(
			LocationPrice.RegularPrice - SUM(ComponentLocationPrice.RegularPrice * Component.Quantity),
			FasciaPrice.RegularPrice - SUM(ComponentFasciaPrice.RegularPrice * Component.Quantity),
			AllPrice.RegularPrice - SUM(ComponentAllPrice.RegularPrice * Component.Quantity)
		) as RegularPrice,
		COALESCE(
			LocationPrice.CashPrice - SUM(ComponentLocationPrice.CashPrice * Component.Quantity),
			FasciaPrice.CashPrice - SUM(ComponentFasciaPrice.CashPrice * Component.Quantity),
			AllPrice.CashPrice - SUM(ComponentAllPrice.CashPrice * Component.Quantity)
		) as CashPrice,
		COALESCE(
			LocationPrice.DutyFreePrice - SUM(ComponentLocationPrice.DutyFreePrice * Component.Quantity),
			FasciaPrice.DutyFreePrice - SUM(ComponentFasciaPrice.DutyFreePrice * Component.Quantity),
			AllPrice.DutyFreePrice - SUM(ComponentAllPrice.DutyFreePrice * Component.Quantity)
		) as DutyFreePrice,
		COALESCE(LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate, 0) as TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	INNER JOIN Merchandising.SetProduct Component
		ON Component.SetId = Product.Id
	LEFT JOIN Merchandising.CurrentSetRetailPriceView as LocationPrice
		ON LocationPrice.ProductId = Product.Id
		AND LocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentStockRetailPriceView	as ComponentLocationPrice
		ON LocationPrice.ProductId = Component.ProductId
		AND ComponentLocationPrice.LocationId = location.id
	LEFT JOIN Merchandising.CurrentSetRetailPriceView as FasciaPrice
		ON FasciaPrice.ProductId = Product.Id
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentStockRetailPriceView	as ComponentFasciaPrice
		ON ComponentFasciaPrice.ProductId = Component.ProductId
		AND ComponentFasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentSetRetailPriceView as AllPrice
		ON AllPrice.ProductId = Product.Id
		AND AllPrice.Fascia IS NULL
		AND AllPrice.LocationId IS NULL
	LEFT JOIN Merchandising.CurrentStockRetailPriceView	as ComponentAllPrice
		ON ComponentAllPrice.ProductId = Component.ProductId
		AND ComponentAllPrice.Fascia IS NULL
		AND ComponentAllPrice.LocationId IS NULL
	WHERE Product.ProductType in ('Set')
	GROUP BY
		Product.Id,
		Location.Id, Location.SalesId,
		LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice,
		LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice,
		LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice,
		LocationPrice.TaxRate, FasciaPrice.TaxRate, AllPrice.TaxRate
) as V

GO