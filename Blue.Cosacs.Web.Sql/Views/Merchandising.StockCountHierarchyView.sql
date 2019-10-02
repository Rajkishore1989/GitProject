IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockCountHierarchyView]'))
DROP VIEW  [Merchandising].[StockCountHierarchyView]
GO

create view [Merchandising].[StockCountHierarchyView] as
select
	h.Id,
	h.StockCountId,
	h.HierarchyLevelId,
	l.Name [Level],
	t.Id as HierarchyTagId,
	t.Name [Tag]
from
	Merchandising.StockCountHierarchy h
	join
	Merchandising.HierarchyLevel l on l.Id = h.HierarchyLevelId
	left join
	Merchandising.HierarchyTag t on t.Id = h.HierarchyTagId