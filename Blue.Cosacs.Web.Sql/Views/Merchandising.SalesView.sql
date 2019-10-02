IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SalesView]'))
DROP VIEW  [Merchandising].[SalesView]
GO

create view [Merchandising].[SalesView] as
select
	ISNULL(CONVERT(Int,ROW_NUMBER() OVER (ORDER BY p.id DESC)), 0) as Id
	,p.Id ProductId
	,p.Sku Sku
	,l.Id StockLocationId
	,l.Name StockLocation
	,convert(date, c.TransactionDate) TransactionDate
	,sum(c.Quantity) Quantity
from
	Merchandising.Product p 
	left join
	Merchandising.CintOrder c on p.SKU = c.Sku
	left join
	Merchandising.Location l on l.SalesId = c.SaleLocation
group by
	 p.Id
	,p.Sku
	,l.Id
	,l.Name
	,convert(date, c.TransactionDate)
	,c.Quantity
