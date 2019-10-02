IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[AbbreviatedStockExportView]'))
DROP VIEW  Merchandising.AbbreviatedStockExportView
Go

CREATE VIEW Merchandising.AbbreviatedStockExportView
AS

SELECT DISTINCT
	price.Id,
	location.Name as LocationName,
	product.Id as ProductId,
	product.Sku,
	product.LongDescription,
	supplier.Name as VendorName,
	ISNULL(product.VendorUPC, '') as VendorUPC,
	stock.StockOnHand,
	price.RegularPrice,
	price.CashPrice,
	cost.LastLandedCost,
	cost.AverageWeightedCost
FROM Merchandising.Product product
INNER JOIN Merchandising.supplier supplier
	ON supplier.id = product.PrimaryVendorId
INNER JOIN Merchandising.[ProductStatus] status
	ON status.Id = Product.[Status]
INNER JOIN Merchandising.CurrentCostPriceView cost
	ON cost.productid = product.id
INNER JOIN Merchandising.CurrentStockPriceByLocationView price
	ON price.productId = product.id
	AND price.RegularPrice IS NOT NULL
	AND price.CashPrice IS NOT NULL
INNER JOIN Merchandising.ProductHierarchy hierarchy
	ON hierarchy.productId = product.Id
INNER JOIN Merchandising.location location
	ON location.id = price.locationid
	AND (
		product.storetypes LIKE '%"' + location.storetype + '"%'
		OR product.storetypes IS NULL
		OR product.storetypes = '[]'
	)
INNER JOIN Merchandising.ProductStockLevel stock
	ON stock.productid = product.id and stock.locationId = location.Id
WHERE status.Name NOT IN ('Deleted', 'Non Active')
	AND stock.StockOnHand != 0
