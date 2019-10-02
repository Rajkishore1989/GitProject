IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[TicketExtractView]'))
	DROP VIEW  Merchandising.TicketExtractView
Go

CREATE VIEW [Merchandising].[TicketExtractView]
AS

SELECT 
	ISNULL(CONVERT(int, ROW_NUMBER() OVER(ORDER BY product.Id)),0) as Id, 
	product.Id as ProductId, 
	product.ProductType, 
	product.SKU, 
	product.LongDescription, 
	POSDescription, 
	product.VendorStyleLong,
	b.BrandName, 
	product.Features, 
	price.Fascia, 
	location.LocationId + '-' + location.Name as LocationName, 
	location.Id as LocationId, 
	CONVERT(VARCHAR(10), price.EffectiveDate, 120) as EffectiveDate, 
	price.CashPrice as CurrentCashPrice, 
	price.RegularPrice as CurrentRegularPrice, 
	price.TaxRate, 
	CASE 
		WHEN product.ProductType = 'Combo' OR product.ProductType = 'Set' THEN product.Id 
		ELSE NULL 
	END as SetId, 
	CASE 
		WHEN product.ProductType = 'Combo' OR product.ProductType = 'Set' THEN product.SKU 
		ELSE NULL 
	END as SetCode, 
	CASE 
		WHEN product.ProductType = 'Combo' OR product.ProductType = 'Set' THEN product.LongDescription 
		ELSE NULL 
	END as SetDescription, 
	price.CashPrice as NormalCashPrice, 
	price.RegularPrice as NormalRegularPrice, 
	price.DutyFreePrice as DutyFreePrice, 
	hierarchy.Hierarchy
FROM Merchandising.Product product
INNER JOIN Merchandising.CurrentRetailPriceView price 
	ON product.id = price.ProductId
LEFT JOIN Merchandising.Location 
	ON location.id = price.LocationId
LEFT JOIN Merchandising.ProductHierarchyConcatView hierarchy 
	ON hierarchy.ProductId = product.id
INNER JOIN Merchandising.ProductStatus s 
	ON s.id = product.Status
LEFT JOIN Merchandising.Brand b 
	ON product.BrandId = b.id
WHERE PriceTicket = 1
	AND s.Name NOT IN ('Inactive', 'Deleted')

go
