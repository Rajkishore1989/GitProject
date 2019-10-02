IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[HyperionSalesView]'))
DROP VIEW  [Merchandising].[HyperionSalesView]
GO

CREATE VIEW [Merchandising].[HyperionSalesView]
AS 
SELECT 
	p.Id AS 'Id',
	loc.Id as LocationId,
	SUM(
		CASE WHEN ord.[Type] = 'Delivery' 
		THEN 
			CASE WHEN ord.SaleType = 'Credit'
			THEN (ord.CashPrice * ord.Quantity) - ord.Tax
			ELSE (ord.Price * ord.Quantity) - ord.Tax 
			END
		ELSE 0 END) AS TotalSalesValue,
	SUM(
		CASE WHEN ord.[Type] = 'Return' 
		THEN 
			CASE WHEN ord.SaleType = 'Credit'
			THEN (ord.CashPrice * ord.Quantity) - ord.Tax
			ELSE (ord.Price * ord.Quantity) - ord.Tax  
			END
		ELSE 0 END) AS TotalReturnsValue,
	SUM(CASE WHEN ord.[Type] = 'Delivery' THEN ord.Quantity ELSE 0 END) AS TotalSalesUnits,
	SUM(CASE WHEN ord.[Type] = 'Return' THEN ord.Quantity ELSE 0 END) AS TotalReturnsUnits
	FROM merchandising.CintDeliveryPriceView ord
	INNER JOIN Merchandising.Location loc on loc.salesId = ord.SaleLocation
	INNER JOIN Merchandising.Product p ON p.sku = ord.sku
	INNER JOIN Merchandising.ProductStatus ps ON ps.Id = p.[Status]
	WHERE DATEPART(m, ord.TransactionDate) = DATEPART(m, DATEADD(m, -1, getdate()))
	AND DATEPART(yyyy, ord.TransactionDate) = DATEPART(yyyy, DATEADD(m, -1, getdate()))
	AND (ps.name != 'Deleted' OR EXISTS(select * from Merchandising.ProductStockLevel psl2 where psl2.productid = p.id AND psl2.StockOnHand > 0))	
	GROUP BY p.Id, loc.Id
GO

