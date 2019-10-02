IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'CheckPermission'
		   AND ss.name = 'Admin')
DROP FUNCTION  Admin.CheckPermission
GO

CREATE FUNCTION Admin.CheckPermission (@UserId INT,@PermissionId INT)
RETURNS BIT
AS
BEGIN

RETURN  ( 
			SELECT CAST (CASE WHEN EXISTS (SELECT 1 
						FROM Admin.UserPermissionsView
						WHERE UserId = @UserId
						AND PermissionId = @PermissionId) THEN 1 ELSE 0 END AS BIT) 
		)
END
