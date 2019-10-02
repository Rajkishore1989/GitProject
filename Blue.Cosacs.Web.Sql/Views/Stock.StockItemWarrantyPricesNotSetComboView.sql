IF OBJECT_ID('Stock.StockItemWarrantyPricesNotSetComboView') IS NOT NULL
	DROP VIEW Stock.StockItemWarrantyPricesNotSetComboView
GO 

CREATE VIEW Stock.StockItemWarrantyPricesNotSetComboView
AS
WITH tax(EffectiveDate, ProductId, Rate, RowId)  
AS  
(  
 SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY EffectiveDate DESC) RowID 
 FROM Merchandising.TaxRate t  
 WHERE t.EffectiveDate <= GETDATE()  
),
    ExportPriceByLocation(ProductId, LocationId, SalesId, CashPrice, TaxRate) AS
    (
   
       SELECT DISTINCT
		    Product.Id as ProductId,
		    Location.Id as LocationId,
		    Location.SalesId,
		    COALESCE(LocationPrice.CashPrice, FasciaPrice.CashPrice, AllPrice.CashPrice) as CashPrice,
		    COALESCE(tId.Rate, t.Rate, 0) AS TaxRate
	    FROM Merchandising.Location Location
	    INNER JOIN 
            Merchandising.ProductStockLevel sl on Location.Id = sl.LocationId
        INNER JOIN 
            Merchandising.Product product on sl.ProductId = product.Id
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
    )
    SELECT
        NEWID() AS Id,
		Product.Id as ProductId,
		Location.Id as LocationId,
        CONVERT(DECIMAL(15,2), ROUND(Merchandising.ApplyTaxRateFunction(LocationPrice.CashPrice,  LocationPrice.TaxRate), 2)) as UnitPriceCash,
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
            merchandising.CurrentCostPriceView cost 
			ON cost.productid = product.id
	    INNER JOIN 
            ExportPriceByLocation as LocationPrice
		    ON LocationPrice.ProductId = Product.Id
		    AND LocationPrice.LocationId = location.id
	WHERE 
        Product.ProductType NOT IN ('Set', 'Combo')