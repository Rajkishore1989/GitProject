IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[NonActiveStatusProgressView]'))
DROP VIEW [Merchandising].[NonActiveStatusProgressView]
GO

CREATE VIEW [Merchandising].[NonActiveStatusProgressView]
AS
--Regular Stock
select distinct product.Id
from[Merchandising].Product 
	inner join [Merchandising].ProductStatus [status] on [status].id = product.[Status] and [status].Name = 'Non Active'
	inner join [Merchandising].CurrentCostPriceView cost on product.id = cost.ProductId 
	inner join [Merchandising].CurrentRetailPriceView retail on product.Id = retail.ProductId
	inner join [Merchandising].Supplier on product.PrimaryVendorId = supplier.Id
	inner join [Merchandising].ProductHierarchyView hierarchy on hierarchy.ProductId = product.Id and hierarchy.[Level] = 'Department'
--Combos
	UNION
	select distinct product.Id
	from[Merchandising].Product 
	inner join [Merchandising].ProductStatus [status] on [status].id = product.[Status] and [status].Name = 'Non Active'
	Inner join [Merchandising].Combo on combo.Id = product.Id and combo.StartDate <= getdate()
	Inner joIN Merchandising.ComboProduct on ComboProduct.ComboId = product.Id
	INNER JOIN [Merchandising].ComboProductPrice price on comboproduct.Id = price.ComboProductId
