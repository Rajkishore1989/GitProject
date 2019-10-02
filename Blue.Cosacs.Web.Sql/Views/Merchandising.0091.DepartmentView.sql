IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].DepartmentView'))
DROP VIEW [Merchandising].DepartmentView
GO

CREATE VIEW [Merchandising].[DepartmentView]
AS
select
	t.Id as TagId,
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
where l.name = 'Department'