IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductHierarchyView]'))
DROP VIEW [Merchandising].[ProductHierarchyView]
GO

CREATE VIEW [Merchandising].[ProductHierarchyView]
AS
SELECT
 h.Id [Id],
 h.ProductId   [ProductId],
 l.id [LevelId],
 l.Name [Level],
 t.Id [TagId],
 t.Name [Tag],
 t.Code,
 p.[Status],
 p.ProductType,
 t.FirstYearWarrantyProvision
FROM
 Merchandising.ProductHierarchy h
 JOIN
 Merchandising.HierarchyLevel l on l.Id = h.HierarchyLevelId
 JOIN
 Merchandising.HierarchyTag t on t.Id = h.HierarchyTagId
 JOIN 
 Merchandising.Product p on p.id = h.ProductId

GO