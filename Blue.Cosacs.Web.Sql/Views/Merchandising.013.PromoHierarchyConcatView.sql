IF EXISTS (SELECT * FROM sys.views where name = 'PromotionalHierarchyConcatView')
DROP VIEW [Merchandising].[PromotionalHierarchyConcatView]
GO

CREATE VIEW [Merchandising].[PromotionalHierarchyConcatView]
AS

SELECT DISTINCT
  p.PromotionDetailId, 
  Hierarchy = '['+STUFF
  (
    (
      SELECT ',' + '{"Id":"' + convert(varchar,t.LevelId) + '","Name":"'+t.name+'"}'
       FROM Merchandising.PromotionHierarchy AS h
	   inner join Merchandising.HierarchyTag t on h.TagId = t.Id
       WHERE h.PromotionDetailId = p.PromotionDetailId
       ORDER BY h.LevelId
       FOR XML PATH(''), TYPE
    ).value('.[1]','nvarchar(max)'),
    1,1,''
  )+']'
FROM Merchandising.PromotionHierarchy AS p

GO

