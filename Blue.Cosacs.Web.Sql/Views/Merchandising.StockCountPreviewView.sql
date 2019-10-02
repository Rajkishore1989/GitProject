IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockCountPreviewView]'))
DROP VIEW  Merchandising.StockCountPreviewView
GO

create view Merchandising.StockCountPreviewView as

SELECT
	ISNULL(CONVERT(Int,ROW_NUMBER() OVER (ORDER BY p.id DESC)), 0) as Id,
	p.Id [ProductId],
	p.Sku,
	p.LongDescription,
	psl.StockOnHand,
	l.Id LocationId,
	ph.HierarchyLevelId,
	ph.HierarchyTagId,
	[LastVariance],
	[LastCountDate],
	[StockCountId]
FROM Merchandising.Location L
CROSS JOIN Merchandising.Product p
INNER JOIN Merchandising.ProductHierarchy ph 
	ON ph.ProductId = p.Id
LEFT JOIN Merchandising.ProductStockLevel psl 
	ON psl.ProductId = p.Id 
	AND psl.LocationId = l.id
LEFT JOIN (
	SELECT 
		scp.ProductId,
		scp.Count + scp.SystemAdjustment - scp.StartStockOnHand as [LastVariance],
		sc.CountDate [LastCountDate],
		sc.Id [StockCountId],
		sc.LocationId
	FROM Merchandising.StockCount sc
	INNER JOIN Merchandising.StockCountProduct scp 
		ON scp.StockCountId = sc.Id
	WHERE sc.StartedDate = (
		SELECT max(sc2.StartedDate)
		FROM Merchandising.StockCountProduct scp2
		INNER JOIN Merchandising.StockCount sc2 
			ON scp2.StockCountId = sc2.Id
		WHERE scp2.ProductId = scp.ProductId
			AND sc2.LocationId = sc.LocationId
			AND sc2.ClosedDate IS NOT NULL
			AND sc2.CancelledDate IS NULL
	)
) stockCount 
	ON stockCount.ProductId = p.Id 
	AND stockCount.LocationId = psl.LocationId 
WHERE (psl.LocationId = l.Id OR psl.LocationId IS NULL)
	AND (stockCount.LocationId = l.Id OR stockCount.LocationId IS NULL)
	AND p.[Status] <> 1
	AND p.ProductType in ('RegularStock', 'SparePart', 'RepossessedStock')