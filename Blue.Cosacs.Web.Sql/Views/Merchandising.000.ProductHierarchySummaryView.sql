IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductHierarchySummaryView]'))
	DROP VIEW [Merchandising].[ProductHierarchySummaryView]
GO

CREATE VIEW Merchandising.ProductHierarchySummaryView
AS

SELECT
	p.Id AS ProductId,
	htDivision.Code AS DivisionCode,
	htDivision.Name AS DivisionName,
	htDivision.Id AS DivisionId,
	htDepartment.Code AS DepartmentCode,
	htDepartment.Name AS DepartmentName,
	htDepartment.Id AS DepartmentId,
	htClass.Code AS ClassCode,
	htClass.Name AS ClassName,
	htClass.id AS ClassId,
	cp.LegacyCode
FROM Merchandising.Product p
LEFT JOIN Merchandising.ProductHierarchy phDivision
	ON p.Id = phDivision.ProductId
    AND phDivision.HierarchyLevelId = (SELECT Id FROM Merchandising.HierarchyLevel WHERE Name = 'Division')
LEFT JOIN Merchandising.HierarchyTag htDivision
	ON htDivision.Id = phDivision.HierarchyTagId
	AND htDivision.LevelId = phDivision.HierarchyLevelId
LEFT JOIN Merchandising.ProductHierarchy phDepartment
	ON p.Id = phDepartment.ProductId
    AND phDepartment.HierarchyLevelId = (SELECT Id FROM Merchandising.HierarchyLevel WHERE Name = 'Department')
LEFT JOIN Merchandising.HierarchyTag htDepartment
	ON htDepartment.Id = phDepartment.HierarchyTagId
	AND htDepartment.LevelId = phDepartment.HierarchyLevelId
LEFT JOIN Merchandising.ProductHierarchy phClass
	ON p.Id = phClass.ProductId
    AND phClass.HierarchyLevelId = (SELECT Id FROM Merchandising.HierarchyLevel WHERE Name = 'Class')
LEFT JOIN Merchandising.HierarchyTag htClass
	ON htClass.Id = phClass.HierarchyTagId
	AND htClass.LevelId = phClass.HierarchyLevelId
LEFT JOIN Merchandising.ClassMapping cp
	ON cp.ClassCode = htClass.Code
WHERE 
	p.Id IN (SELECT ProductId FROM Merchandising.ProductHierarchy)
GO