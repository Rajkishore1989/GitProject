IF  EXISTS (SELECT
	*
FROM sys.views
WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductsToIndexView]')) DROP VIEW [Merchandising].[ProductsToIndexView]
GO

CREATE VIEW [Merchandising].[ProductsToIndexView]
AS
SELECT
	rp.ProductId as Id
FROM Merchandising.RetailPrice rp
WHERE rp.EffectiveDate = CONVERT(DATE, GETUTCDATE()) UNION SELECT
	p.id
FROM Merchandising.TaxRate t
CROSS JOIN merchandising.product p
WHERE t.productid IS NULL
AND t.EffectiveDate = CONVERT(DATE, GETUTCDATE()) UNION SELECT
	t.ProductId
FROM Merchandising.TaxRate t
WHERE t.productid IS NOT NULL
AND t.EffectiveDate = CONVERT(DATE, GETUTCDATE()) UNION SELECT DISTINCT
	pd.ProductId AS Id
FROM Merchandising.Promotion p
JOIN merchandising.PromotionDetail pd
	ON p.id = pd.PromotionId
	AND (p.StartDate = CONVERT(DATE, GETUTCDATE())
	OR p.EndDate = dateadd(day,-1,CONVERT(DATE, GETUTCDATE())))
	AND pd.ProductId IS NOT NULL