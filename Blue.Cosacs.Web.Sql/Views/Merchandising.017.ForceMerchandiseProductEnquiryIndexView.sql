IF EXISTS (SELECT * FROM sys.views WHERE name = 'ForceMerchandiseProductEnquiryIndexView')
DROP VIEW [Merchandising].[ForceMerchandiseProductEnquiryIndexView]
GO

CREATE VIEW [Merchandising].[ForceMerchandiseProductEnquiryIndexView]
AS


SELECT 
	productid as Id,
	ProductId,
	SKU,
	LongDescription,
	POSDescription,
	ProductType,
	Tags,
	StoreTypes,
	PrimaryVendor,
	Suppliers,
	CreatedDate,
	Status,
	Hierarchy,
	LevelTags,
	Condition,
	StockAvailable,
	StockOnHand,
	StockOnOrder,
	StockAllocated,
	LabelRequired,
	CorporateUPC,
	VendorUPC
FROM (
	SELECT  
		product.Id as ProductId,
		SKU,
		LongDescription,
		product.POSDescription,
		ProductType,
		Product.Tags,
		StoreTypes,
		LabelRequired,
		primaryVendor.Name as PrimaryVendor, Suppliers,
		CreatedDate,
		[status].name AS [Status],
		h.Hierarchy,
		h.LevelTags,
		condition.Condition,
		SUM(stock.StockAvailable) AS StockAvailable,
		SUM(stock.StockOnHand) AS StockOnHand,
		SUM(stock.StockOnOrder) AS StockOnOrder,
		SUM(stock.StockAllocated) AS StockAllocated,
		CorporateUPC,
		VendorUPC
	FROM merchandising.product product
	INNER JOIN merchandising.ProductStatus [status] 
		ON product.[Status] = [status].id
	LEFT OUTER JOIN Merchandising.[LocationStockLevelView] [Stock] 
		on [Stock].ProductId = Product.id 
		and [Stock].virtualwarehouse = 0
	LEFT JOIN Merchandising.[ProductSupplierConcatView] [Vendor] 
		on [Vendor].ProductId = Product.id
	LEFT JOIN [Merchandising].[RepossessedProductConditionView] condition 
		on condition.productid = product.id
	LEFT JOIN Merchandising.ProductHierarchyConcatView h 
		on h.ProductId = product.id
	LEFT JOIN Merchandising.Supplier primaryVendor 
		on primaryVendor.Id = product.PrimaryVendorId
	GROUP BY 
		product.Id,
		SKU,
		LongDescription,
		ProductType,
		Product.Tags,
		StoreTypes,
		primaryVendor.Name,
		Suppliers,
		POSDescription,
		CreatedDate,
		[status].name,
		condition.Condition,
		h.hierarchy,
		h.LevelTags,
		LabelRequired,
		CorporateUPC,
		VendorUPC
) AS TEMP_TABLE
