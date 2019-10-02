IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].UserPermissionsView'))
DROP VIEW [Merchandising].[UserPermissionsView]
GO

CREATE VIEW [Merchandising].[UserPermissionsView]
AS
	SELECT
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY u.id ASC)) AS Id,
	u.Id AS [UserId],
	[u].[BranchNo],
	[u].[Login],
	[u].[Password],
	[u].[LastChangePassword],
	[u].[FirstName],
	[u].[LastName],
	[u].[ExternalLogin],
	[u].[LegacyPassword],
	[u].[eMail],
	[u].[Locked],
	[u].[FullName],
	[u].[RequireChangePassword],
	[u].[FactEmployeeNo],
	[u].[AddressLine1],
	[u].[AddressLine2],
	[u].[AddressLine3],
	[u].[PostCode],
	[u].[Phone],
	[u].[PhoneAlternate],
	p.Id AS PermissionId,
	p.Name AS PermissionName,
	p.[Description] AS PermissionDescription
FROM [Admin].UserPermissionsView upv
INNER JOIN [Admin].[User] u
	ON u.Id = upv.UserId
INNER JOIN [Admin].[Permission] p
	ON p.Id = upv.PermissionId

GO
