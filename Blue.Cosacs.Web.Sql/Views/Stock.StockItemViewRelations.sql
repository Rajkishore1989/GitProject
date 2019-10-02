IF OBJECT_ID('Stock.StockItemViewRelations') IS NOT NULL
    DROP VIEW Stock.StockItemViewRelations
GO

CREATE VIEW Stock.StockItemViewRelations
AS
	SELECT 
		ItemNumber, 
		DepartmentCode, 
		MAX(Department) AS Department, 
		Category, 
		MAX(CategoryName) AS CategoryName, 
		Class, 
		MAX(ClassName) AS ClassName
	FROM 
	(	
		SELECT
			p.SKU AS ItemNumber,
			ISNULL(htDivision.Code, '') AS DepartmentCode,
			ISNULL(htDivision.Name, '') AS Department,
			ISNULL(CONVERT(SMALLINT, cp.LegacyCode), 0) AS Category,
			ISNULL(htDepartment.Name, '') AS CategoryName,
			ISNULL(htClass.Code, '') AS Class,
			ISNULL(htClass.Name, '') AS ClassName
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
		WHERE COALESCE(htDivision.Code, htDepartment.Code, htClass.Code) IS NOT NULL
	) Data
	GROUP BY 
		ItemNumber, DepartmentCode, Category, Class

