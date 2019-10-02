IF EXISTS (SELECT * FROM sys.views WHERE name = 'ForceMerchandiseStockLevelsView')
DROP VIEW [Merchandising].[ForceMerchandiseStockLevelsView]
GO

CREATE VIEW [Merchandising].[ForceMerchandiseStockLevelsView]
AS

	
	SELECT	product.Id as ProductId,
			SKU,
			LongDescription,
			ProductType,
			product.Tags,
			StoreTypes,
			primaryVendor.Name as PrimaryVendor, 
			Vendor.Suppliers,
			product.CreatedDate,
			[status].name AS [Status],
			convert(varchar, l.LocationId) LocationNumber,
			[Stock].name AS Location,
			[Stock].Fascia,
			[Stock].Warehouse,
			l.VirtualWarehouse,
			l.Id LocationId,
			condition.Condition,
			stock.StockAvailable AS StockAvailable,
			stock.StockOnHand AS StockOnHand,
			stock.StockOnOrder AS StockOnOrder,
			stock.StockAllocated AS StockAllocated,
			c.AverageWeightedCost
	FROM 	merchandising.product product
	INNER JOIN merchandising.ProductStatus [status] ON product.[Status] = [status].id
	LEFT OUTER JOIN Merchandising.[ProductSupplierConcatView] [Vendor] on [Vendor].ProductId = Product.id
	JOIN Merchandising.[LocationStockLevelView] [Stock] on [Stock].ProductId = Product.id
	LEFT OUTER JOIN Merchandising.Combo combo on combo.Id = product.Id
	LEFT OUTER JOIN Merchandising.[SetProduct] [SET] on [Set].Id = product.Id
	LEFT OUTER JOIN [Merchandising].[RepossessedProductConditionView] condition on condition.productid = product.id
	LEFT OUTER JOIN Merchandising.Supplier primaryVendor on primaryVendor.Id = product.PrimaryVendorId
	LEFT OUTER JOIN Merchandising.Location l on l.Id = stock.LocationId
	LEFT OUTER JOIN Merchandising.CurrentCostPriceView c on stock.ProductId = c.ProductId
	where stock.locationid is not null 
