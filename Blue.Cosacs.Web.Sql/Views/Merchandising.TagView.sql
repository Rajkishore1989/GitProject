IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].TagView'))
DROP VIEW [Merchandising].TagView
GO

CREATE VIEW [Merchandising].[TagView]
AS
select
	t.Id,
	t.LevelId [LevelId],
	t.Code,
	l.Name [LevelName],
	t.Name [TagName],
	t.[FirstYearWarrantyProvision],
	t.AgedAfter
from
	[Merchandising].[HierarchyTag] t
	join
	[Merchandising].[HierarchyLevel] l on t.LevelId = l.Id