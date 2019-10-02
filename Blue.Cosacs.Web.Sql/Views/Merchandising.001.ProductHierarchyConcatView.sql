IF EXISTS (SELECT * FROM sys.views where name = 'ProductHierarchyConcatView')
    DROP VIEW [Merchandising].[ProductHierarchyConcatView]
GO

CREATE VIEW [Merchandising].[ProductHierarchyConcatView]
AS

SELECT 
    CONVERT(Int,ROW_NUMBER() OVER (ORDER BY hierarchy.productid DESC)) as Id,
    hierarchy.*
FROM (
    SELECT DISTINCT
        p.ProductId, 
        Hierarchy = '[' + STUFF
        (
            (
                SELECT ',' + '{"Id":"' + CONVERT(VARCHAR, t.LevelId) + '","Name":"' + t.name + '"}'
                FROM Merchandising.ProductHierarchy AS h
                INNER JOIN Merchandising.HierarchyTag t 
                    ON h.HierarchyTagId = t.Id
                WHERE h.ProductId = p.ProductId
                ORDER BY h.HierarchyLevelId
                FOR XML PATH(''), TYPE
            ).value('.[1]', 'NVARCHAR(MAX)'),
            1,
            1,
            ''
        ) + ']',
   LevelTags = '['+STUFF
  (
    (
      SELECT ',' + '{"LevelId":"' + CONVERT(varchar, t .LevelId) + '","TagName":"' + t .name + '","TagId":"' + CAST(h.HierarchyTagId AS nvarchar) +'"}'
       FROM Merchandising.ProductHierarchy AS h
	   inner join Merchandising.HierarchyTag t on h.HierarchyTagId = t.Id
       WHERE h.ProductId = p.ProductId
       ORDER BY h.HierarchyLevelId
       FOR XML PATH(''), TYPE
    ).value('.[1]','nvarchar(max)'),
    1,1,''
  )+']'
    FROM Merchandising.ProductHierarchy AS p
) hierarchy

GO