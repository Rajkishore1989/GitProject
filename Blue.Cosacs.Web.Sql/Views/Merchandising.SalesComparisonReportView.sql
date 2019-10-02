IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SalesComparisonReportView]'))
DROP VIEW [Merchandising].[SalesComparisonReportView]
GO

CREATE VIEW [Merchandising].[SalesComparisonReportView]
AS

		SELECT price.Id, product.Id as ProductId,product.Sku, product.LongDescription 
			, Location.Id as LocationId, Location.Fascia, Location.SalesId, Location.Name as LocationName
			,brand.Id as BrandId, brand.BrandName, product.Tags 
			,isnull(Stock.StockOnHand, 0) as StockOnHand
			, isnull(Stock.StockOnOrder, 0) as StockOnOrder
			, requested.QuantityPending as StockRequested
			,price.RegularPrice as CurrentRegularPrice, price.CashPrice as CurrentCashPrice
			,div.Tag as Division, dep.Tag as Department, class.Tag as Class
		FROM Merchandising.CurrentStockPriceByLocationView price
		INNER JOIN Merchandising.Location location on location.id = price.LocationId
		INNER JOIN Merchandising.Product product on price.productId = product.id and (nullif(nullif(StoreTypes, '[]'), '') is null OR StoreTypes like '%' +location.StoreType+ '%')
		--division
		LEFT JOIN Merchandising.ProductHierarchyView div on div.[Level] = 'Division' and div.ProductId = product.Id
		--department
		LEFT JOIN Merchandising.ProductHierarchyView dep on dep.[Level] = 'Department' and dep.ProductId = product.Id
		--class
		LEFT JOIN Merchandising.ProductHierarchyView class on class.[Level] = 'Class' and class.ProductId = product.Id
		
		
		LEFT JOIN Merchandising.ProductStockLevel stock on stock.LocationId = location.id and stock.ProductId = product.Id
		LEFT OUTER JOIN Merchandising.StockRequisitionPendingView requested on requested.productid = product.id and requested.ReceivingLocationid = location.id
		LEFT OUTER JOIN Merchandising.Brand brand on brand.Id = product.BrandId
GO

