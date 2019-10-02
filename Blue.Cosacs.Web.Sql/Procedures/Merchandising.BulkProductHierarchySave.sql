IF OBJECT_ID('Merchandising.BulkHierarchySave') IS NOT NULL
	DROP PROCEDURE Merchandising.BulkHierarchySave
GO 

CREATE PROCEDURE Merchandising.BulkHierarchySave		
AS
BEGIN
DELETE p FROM  [Merchandising].[ProductHierarchy] p
WHERE EXISTS (SELECT 1 
              FROM merchandising.[ProductHierarchyStaging] s
			  WHERE s.ProductId = p.productid)

INSERT INTO [Merchandising].[ProductHierarchy]
(ProductId, HierarchyTagId, HierarchyLevelId)
SELECT DISTINCT ProductId, HierarchyTagId, HierarchyLevelId
FROM [Merchandising].[ProductHierarchyStaging]
END