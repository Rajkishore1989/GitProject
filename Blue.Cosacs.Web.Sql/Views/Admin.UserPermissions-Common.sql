-- transaction: true
-- Change the previous line to false to disable running this whole migration in one transaction.
-- Removing that first line will default to 'true'.
-- 
-- Put your SQL code here
IF NOT Object_Id('Admin.UserPermissionsView') IS NULL 
	DROP VIEW Admin.UserPermissionsView
GO
/*Old view*/
IF NOT Object_Id('Admin.UserPermissions') IS NULL 
	DROP VIEW Admin.UserPermissions
GO

CREATE VIEW Admin.UserPermissionsView
AS
	WITH RolePermissionWithDelegate AS (
			SELECT
				RoleId,
				PermissionId,
				[Deny]
			FROM Admin.RolePermission
			where [Deny] = 0
		UNION
			SELECT
				RP.RoleId,
				PD.DelegatePermission AS PermissionId,
				0 AS [Deny]
			FROM Admin.RolePermission RP
			INNER JOIN Admin.PermissionDelegate PD	ON RP.PermissionId = PD.MainPermission 
	)
	SELECT 
		RP.PermissionId, 
		UR.UserId 
	FROM  
		RolePermissionWithDelegate RP 
		INNER JOIN Admin.UserRole ur ON RP.RoleId = ur.RoleId 
	WHERE NOT EXISTS (SELECT 1
					  FROM Admin.RolePermission RP2 
			          INNER JOIN Admin.UserRole ur2 ON RP2.RoleId = ur2.RoleId 
					  WHERE ur2.RoleId = ur.RoleId
					  AND RP.PermissionId = RP2.PermissionId
					  AND RP2.[deny] = 1)
GO



