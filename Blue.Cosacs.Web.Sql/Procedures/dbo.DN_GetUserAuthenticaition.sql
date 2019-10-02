if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_GetUserAuthentication]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_GetUserAuthentication]
GO

Create PROCEDURE [dbo].[DN_GetUserAuthentication]
(
	@UserId INT,
	@Password NVARCHAR(100),
	@return INT OUTPUT
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
SET NOCOUNT ON;
SELECT
au.ID AS UserId,
au.[Password] AS UserPassword,
au.Locked AS Locked,
au.RequireChangePassword AS ChangePassword,
arp.[Deny] AS UserDeny
FROM [Admin].[User] au
INNER JOIN [Admin].[UserRole] aur on au.ID = aur.UserId
INNER JOIN [Admin].[RolePermission] arp on aur.RoleId = arp.RoleId
WHERE
arp.PermissionId IN (1622,1618) -- To Add or Change Technician Diary Bookings And To Delete Technician Diary Bookings
AND
au.ID = @UserId
SET @return = @@error
END
GO