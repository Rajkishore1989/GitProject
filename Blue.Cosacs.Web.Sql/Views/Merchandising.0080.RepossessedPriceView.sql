IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RepossessedPriceView]'))
DROP VIEW  [Merchandising].[RepossessedPriceView]
GO

CREATE VIEW [Merchandising].[RepossessedPriceView]
AS

WITH tax(EffectiveDate, ProductId, Rate, RowId)  
AS  
(  
 SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY EffectiveDate DESC) RowID 
 FROM Merchandising.TaxRate t  
 WHERE t.EffectiveDate <= GETDATE()  
),
repoConditionId(productId, RepossessedConditionId,HierarchyLevelId)
AS
(
	SELECT 
		p.productid, 
		c.RepossessedConditionId, 
		MAX(t.levelid) AS HierarchyLevelId 
	FROM [Merchandising].[HierarchyTagCondition] c
	INNER JOIN [Merchandising].[HierarchyTag] t ON t.id = c.HierarchyTagId
	INNER JOIN Merchandising.ProductHierarchy p ON p.HierarchyTagId = c.HierarchyTagId
	WHERE c.Percentage is not null
	GROUP BY p.productid, c.repossessedconditionid 
)  
SELECT
	CONVERT(int,ROW_NUMBER()OVER(ORDER BY r.Id DESC)) as Id,
	rp.locationId,r.Id as ProductId,
	rp.EffectiveDate,
	CONVERT(money, rp.RegularPrice * hc.Percentage) as RegularPrice,
	CONVERT(money, rp.CashPrice * hc.Percentage) as CashPrice,
	CONVERT(money, rp.DutyFreePrice * hc.Percentage) as DutyFreePrice,
	rp.Fascia,
	COALESCE(tId.Rate, t.Rate, 0) AS TaxRate,
	l.Name
FROM [Merchandising].[RetailPrice] rp
INNER JOIN [Merchandising].[RepossessedProduct] r ON r.OriginalProductId = rp.ProductId
INNER JOIN [Merchandising].[Product] p ON p.Id = r.Id
INNER JOIN repoConditionId c ON c.RepossessedConditionId = r.RepossessedConditionId	AND r.OriginalProductId = c.ProductId
INNER JOIN Merchandising.ProductHierarchy h ON h.ProductId = r.OriginalProductid AND h.HierarchyLevelId = c.HierarchyLevelId
INNER JOIN [Merchandising].[HierarchyTagCondition] hc ON hc.HierarchyTagId = h.HierarchyTagId AND hc.RepossessedConditionId = c.RepossessedConditionId
LEFT JOIN [Merchandising].[Location] l ON rp.LocationId = l.id
LEFT JOIN tax AS tId ON tId.ProductId = p.Id AND tId.rowid = 1
LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
GO