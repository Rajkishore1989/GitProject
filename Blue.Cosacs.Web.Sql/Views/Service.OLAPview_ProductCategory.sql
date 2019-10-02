IF EXISTS (SELECT * FROM Sys.Objects AS So INNER JOIN Sys.Schemas AS Ss ON So.Schema_Id = Ss.Schema_Id WHERE So.Type = 'V' AND So.Name = 'OLAPview_ProductCategory' AND Ss.Name = 'Service')
	DROP VIEW Service.Olapview_Productcategory
GO

CREATE VIEW Service.Olapview_Productcategory
AS
	SELECT
		CAST(C.Code AS SMALLINT) AS Productcategory
	  ,C.Codedescript AS Categoryname
	  ,Cc.Category AS Productgroupkey
	FROM
		Code AS C
		INNER JOIN Codecat AS Cc ON
		C.Category = Cc.Category
	WHERE 
		C.Category LIKE 'PC%'
	UNION
	SELECT
		0
	  ,'Unknown'
	  ,'PCO'

GO
