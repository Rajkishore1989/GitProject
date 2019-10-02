

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[BuyerSalesHistoryReportView]'))
DROP VIEW [Merchandising].[BuyerSalesHistoryReportView]
GO

CREATE VIEW [Merchandising].[BuyerSalesHistoryReportView]
AS

WITH AWC 
AS
(
select ProductId, AverageWeightedCost, ROW_NUMBER() OVER (PARTITION BY productId order by averageweightedCostUpdated desc, id desc) [Row]
from Merchandising.CostPrice
)
SELECT 
	ROW_NUMBER() OVER( ORDER BY Product.Id, years.NumericYear ) as Id,  
	product.Id as ProductId, 
	product.Sku, 
	product.LongDescription, 
	product.ProductType, 
	brand.BrandName, 
	supplier.Name as Vendor,
	location.Id as LocationId, 
	location.Name as LocationName, 
	location.Fascia, 
	location.Warehouse,
	stock.StockOnHand, 
	stock.StockOnOrder,
	cost.AverageWeightedCost, 
	price.CashPrice, 
	price.taxrate, 
	years.[Year], 
	years.NumericYear, 
	years.StartDate, 
	years.EndDate,PreviousProductType
FROM Merchandising.CurrentStockPriceByLocationView price
CROSS JOIN Merchandising.BuyerSalesHistoryYearView years
INNER JOIN Merchandising.Location location 
	ON location.id = price.LocationId
INNER JOIN Merchandising.Product product 
	ON price.productId = product.id 
	AND (NULLIF(NULLIF(StoreTypes, '[]'), '') IS NULL 
	OR StoreTypes LIKE '%' + location.StoreType + '%')
INNER JOIN Merchandising.ProductStatus status 
	ON status.Id = product.Status
INNER JOIN Merchandising.Supplier supplier 
	ON supplier.Id = product.primaryvendorId
INNER JOIN AWC cost ON cost.ProductId = product.Id AND [Row] = 1
LEFT JOIN Merchandising.ProductStockLevel stock 
	ON stock.LocationId = location.id 
	AND stock.ProductId = product.Id
LEFT JOIN merchandising.Brand brand 
	ON brand.Id = product.BrandId
WHERE status.Name NOT IN ('Inactive', 'Deleted')

GO

