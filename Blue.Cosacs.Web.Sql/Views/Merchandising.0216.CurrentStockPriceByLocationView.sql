
IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentStockPriceByLocationView]'))
	DROP VIEW  [Merchandising].[CurrentStockPriceByLocationView]
GO

CREATE VIEW [Merchandising].[CurrentStockPriceByLocationView]
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
	SELECT DISTINCT
		Product.Id as ProductId, 
		Location.Id as LocationId, 
		Location.SalesId, 
		COALESCE(
			LocationPrice.RegularPrice, 
			FasciaPrice.RegularPrice, 
			AllPrice.RegularPrice, 
			ReposessedLocationPrice.RegularPrice, 
			ReposessedFasciaPrice.RegularPrice, 
			ReposessedAllPrice.RegularPrice
		) as RegularPrice, 
		COALESCE(
			LocationPrice.CashPrice, 
			FasciaPrice.CashPrice, 
			AllPrice.CashPrice, 
			ReposessedLocationPrice.CashPrice, 
			ReposessedFasciaPrice.CashPrice, 
			ReposessedAllPrice.CashPrice
		) as CashPrice, 
		COALESCE(
			LocationPrice.DutyFreePrice, 
			FasciaPrice.DutyFreePrice, 
			AllPrice.DutyFreePrice, 
			ReposessedLocationPrice.DutyFreePrice, 
			ReposessedFasciaPrice.DutyFreePrice, 
			ReposessedAllPrice.DutyFreePrice
		) as DutyFreePrice, 
		COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
	FROM Merchandising.Location Location
	CROSS JOIN Merchandising.Product Product
	LEFT JOIN Merchandising.CurrentStockRetailPriceView LocationPrice 
		ON LocationPrice.ProductId = Product.Id 
		AND LocationPrice.LocationId = Location.Id
	LEFT JOIN Merchandising.CurrentStockRetailPriceView	FasciaPrice 
		ON FasciaPrice.ProductId = Product.Id 
		AND FasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentStockRetailPriceView	AllPrice 
		ON AllPrice.ProductId = Product.Id 
		AND AllPrice.Fascia IS NULL 
		AND AllPrice.LocationId IS NULL
	LEFT JOIN Merchandising.CurrentRepossessedRetailPriceView ReposessedLocationPrice 
		ON ReposessedLocationPrice.ProductId = Product.Id 
		AND ReposessedLocationPrice.LocationId = Location.Id
	LEFT JOIN Merchandising.CurrentRepossessedRetailPriceView ReposessedFasciaPrice
		ON ReposessedFasciaPrice.ProductId = Product.Id 
		AND ReposessedFasciaPrice.Fascia = Location.Fascia
	LEFT JOIN Merchandising.CurrentRepossessedRetailPriceView ReposessedAllPrice 
		ON ReposessedAllPrice.ProductId = Product.Id 
		AND ReposessedAllPrice.Fascia IS NULL 
		AND ReposessedAllPrice.LocationId IS NULL
    LEFT JOIN tax AS tId ON tId.ProductId = Product.Id AND tId.rowid = 1
   LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
	WHERE Product.ProductType NOT IN ('Set', 'Combo') 
) as V

GO