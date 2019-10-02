IF EXISTS (SELECT * FROM sys.views WHERE name = 'ProductEnquirySalesPivotView')
DROP VIEW [Merchandising].[ProductEnquirySalesPivotView]
GO

--CREATE VIEW [Merchandising].[ProductEnquirySalesPivotView]
--AS

--SELECT ProductId as Id, ProductId, [1] as ThisPeriod, [2] as LastPeriod, [3] as ThisYTD, [4] as LastYTD
--FROM 
--(SELECT product.id as ProductId, period.ID as PeriodId, Quantity

--from merchandising.CintOrder delivery
--inner join merchandising.product product on product.sku = delivery.sku
--inner join merchandising.SalesPeriodView period on delivery.TransactionDate between period.StartDate and period.EndDate
--where [type] in ('Delivery', 'Return')) p
--PIVOT
--(
--SUM (Quantity)
--FOR PeriodId IN
--( [1], [2], [3], [4] )
--) AS pvt
