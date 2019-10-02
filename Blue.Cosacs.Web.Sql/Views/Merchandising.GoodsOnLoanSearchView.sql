IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[GoodsOnLoanSearchView]'))
DROP VIEW  [Merchandising].[GoodsOnLoanSearchView]
GO

CREATE VIEW [Merchandising].[GoodsOnLoanSearchView]
AS

SELECT
	gp.Id,
	g.Id as GoodsOnLoanId,
	g.StockLocationId,
	l.Name [StockLocation],
	g.ExpectedCollectionDate,
	g.CollectedDate,
	g.CreatedOn,
	g.Comments,
	g.BusinessName,
	g.CustomerId,
	CASE 
		WHEN g.CollectedDate IS NOT NULL THEN 'Completed' 
		ELSE 
		CASE 
			WHEN GETUTCDATE() > g.ExpectedCollectionDate then 'Awaiting Collection' 
			ELSE 'In Progress' 
		END 
	END [Status],
	CASE 
		WHEN g.CustomerId is null then 'Business' 
		ELSE 'Customer' 
	END [Type],
	gp.ReferenceNumber,
	p.SKU,
	SUM(gp.AverageWeightedCost * gp.Quantity) TotalCost
from Merchandising.GoodsOnLoan g
INNER JOIN Merchandising.GoodsOnLoanProduct gp 
	ON gp.GoodsOnLoanId = g.Id
INNER JOIN Merchandising.Product p 
	ON gp.ProductId = p.Id
INNER JOIN Merchandising.Location l 
	ON g.StockLocationId = l.Id
INNER JOIN [Admin].[User] u 
	ON g.CreatedById = u.Id
GROUP BY
	 gp.Id,
	 g.Id,
	 g.StockLocationId,
	 l.Name,
	 g.ExpectedCollectionDate,
	 g.CreatedOn,
	 g.Comments,
	 g.BusinessName,
	 g.CustomerId,
	 g.CollectedDate,
	 g.ExpectedCollectionDate,
	 gp.ReferenceNumber,
	 p.SKU,
	 gp.AverageWeightedCost,
	 gp.Quantity