IF OBJECT_ID('Stock.StockItemWarrantyPricesComboView') IS NOT NULL
	DROP VIEW Stock.StockItemWarrantyPricesComboView
GO 

CREATE VIEW Stock.StockItemWarrantyPricesComboView
AS
	
WITH tax(EffectiveDate, ProductId, Rate, RowId)  
AS  
(  
 SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY EffectiveDate DESC) RowID 
 FROM Merchandising.TaxRate t  
 WHERE t.EffectiveDate <= GETDATE()  
),
ExportPriceByLocation (ProductId, LocationId, SalesId, RegularPrice, TaxRate) AS
(
	SELECT
		Product.Id as ProductId,
		Location.Id as LocationId,
		Location.SalesId,
		COALESCE(
			LocationPrice.RegularPrice - SUM(ComponentLocationPrice.RegularPrice * Component.Quantity),
			FasciaPrice.RegularPrice - SUM(ComponentFasciaPrice.RegularPrice * Component.Quantity),
			AllPrice.RegularPrice - SUM(ComponentAllPrice.RegularPrice * Component.Quantity)
		) as RegularPrice,
		COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
	FROM Merchandising.Location Location
	INNER JOIN Merchandising.ProductStockLevel sl on Location.Id = sl.LocationId
    INNER JOIN Merchandising.Product product on sl.ProductId = product.Id
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
	LEFT JOIN tax AS tId ON tId.ProductId = Product.Id AND tId.rowid = 1
	LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
	WHERE Product.ProductType IN ('Combo')
	GROUP BY
		Product.Id,
		Location.Id, Location.SalesId,
		LocationPrice.RegularPrice, FasciaPrice.RegularPrice, AllPrice.RegularPrice,
		LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice,
		LocationPrice.DutyFreePrice, FasciaPrice.DutyFreePrice, AllPrice.DutyFreePrice,
		COALESCE(tId.Rate, t.Rate, 0)  
)   

   
       SELECT 
            NEWID() as Id,
	        Product.Id as ProductId,  
			Location.Id as LocationId,
			CONVERT(DECIMAL(15,2), ROUND(Merchandising.ApplyTaxRateFunction(RegularPrice, TaxRate), 2)) as UnitPriceHP,
			ISNULL(cost.AverageWeightedCost, 0) as CostPrice
			
	    FROM 
		    Merchandising.Location Location
	    INNER JOIN 
            Merchandising.ProductStockLevel SL 
            ON Location.Id = SL.LocationId
	    INNER JOIN 
            Merchandising.Product Product
            ON SL.ProductId = Product.id
		INNER JOIN 
            ExportPriceByLocation price 
		    ON price.ProductId = product.Id
            and price.LocationId = Location.Id
		LEFT JOIN 
            merchandising.CurrentCostPriceView cost 
		    ON cost.productid = product.id
		INNER JOIN 
            merchandising.ProductStatus prodstat 
			ON prodstat.Id = product.[Status]
		WHERE 
		    productType in ('Combo')
			and prodstat.Name != 'Non Active' 

           
           


        