IF OBJECT_ID('Merchandising.TruncateProductStaging') IS NOT NULL
	DROP PROCEDURE Merchandising.TruncateProductStaging
GO 

CREATE PROCEDURE Merchandising.TruncateProductStaging
WITH EXECUTE AS OWNER
AS 
	TRUNCATE TABLE Merchandising.ProductStaging
	TRUNCATE TABLE [Merchandising].[ProductHierarchyStaging]
	TRUNCATE TABLE [Merchandising].IncotermStaging