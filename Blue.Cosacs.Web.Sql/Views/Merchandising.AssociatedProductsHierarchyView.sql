IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[AssociatedProductsHierarchyView]'))
	DROP VIEW Merchandising.AssociatedProductsHierarchyView
GO

CREATE VIEW Merchandising.AssociatedProductsHierarchyView
AS

  SELECT 
        distinct tdiv.Name as Division, tDepartment.Name as Department, tClass.Name as Class
  FROM 
        merchandising.ProductHierarchy pdiv
  LEFT JOIN 
        Merchandising.HierarchyTag tdiv on pdiv.HierarchyTagId = tdiv.Id
  LEFT JOIN 
        Merchandising.ProductHierarchy pDepartment
  ON pDepartment.ProductId = pdiv.ProductId
  LEFT JOIN 
        Merchandising.HierarchyTag tDepartment on pDepartment.HierarchyTagId = tDepartment.Id
  LEFT JOIN 
        Merchandising.ProductHierarchy pClass 
  ON pClass.ProductId = pdiv.ProductId
  LEFT JOIN 
        Merchandising.HierarchyTag tClass on pClass.HierarchyTagId = tClass.Id
  
  WHERE 
        pdiv.HierarchyLevelId = 1
        and pDepartment.HierarchyLevelId = 2
        and pClass.HierarchyLevelId = 3

