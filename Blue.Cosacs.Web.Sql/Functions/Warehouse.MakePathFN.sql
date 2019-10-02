IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'MakePathFN'
		   AND ss.name = 'Warehouse')
DROP FUNCTION  Warehouse.MakePathFN
GO

CREATE FUNCTION [Warehouse].[MakePathFN] (@ParentId INT,@currentId INT)
RETURNS VARCHAR(100)
AS
BEGIN
RETURN (
	SELECT ISNULL(PATH,'') + CONVERT(VARCHAR,@currentId) + '.' 
	FROM Warehouse.Booking
	WHERE id = @ParentId )
END



