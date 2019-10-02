IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PromotionHierarchiesToIndex]'))
DROP VIEW  [Merchandising].[PromotionHierarchiesToIndex]
GO

CREATE VIEW [Merchandising].[PromotionHierarchiesToIndex]
AS
SELECT
	ISNULL(CONVERT(INT, ROW_NUMBER() OVER (ORDER BY productid DESC)), 0) AS Id,
	ph.PromotionDetailId,
	ph.LevelId,
	ph.TagId
FROM Merchandising.Promotion p
JOIN merchandising.PromotionDetail pd
	ON p.id = pd.PromotionId
JOIN Merchandising.PromotionHierarchy ph
	ON pd.id = ph.PromotionDetailId
	AND (p.StartDate = CONVERT(DATE, GETUTCDATE())
	OR p.EndDate = dateadd(day,-1,CONVERT(DATE, GETUTCDATE())))