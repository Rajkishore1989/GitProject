IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[TopSkuReportView]'))
DROP VIEW  [Merchandising].[TopSkuReportView]
GO

CREATE VIEW [Merchandising].[TopSkuReportView] AS 
	SELECT ROW_NUMBER() OVER(ORDER BY p.Id DESC) AS Id  
	, p.Id as ProductId
	, p.SKU as Sku
	, p.StoreTypes
	, br.BrandName
	, p.LongDescription
	, p.Tags
	, ord.TransactionDate
	, loc.Id as LocationId
	, loc.Name as LocationName
	, loc.Fascia	
	, ISNULL(ord.Quantity, 0) AS QuantityDelivered
	, ISNULL(ord.Price * ord.Quantity, 0) AS ValueDelivered	
	, ISNULL((ord.Price * ord.Quantity) + ord.Discount, 0) AS NetValueDelivered
	FROM Merchandising.Product p
	INNER JOIN merchandising.CintOrder ord ON p.SKU = ord.Sku AND ord.[Type] = 'Delivery'
	INNER JOIN Merchandising.Location loc ON loc.SalesId = ord.SaleLocation	
	INNER JOIN Merchandising.ProductStatus ps ON ps.Id = p.[Status]	
	INNER JOIN Merchandising.Brand br on br.Id = p.BrandId		
	WHERE ps.name != 'Deleted'
GO
