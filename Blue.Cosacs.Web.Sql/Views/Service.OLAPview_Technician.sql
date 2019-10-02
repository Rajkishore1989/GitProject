IF OBJECT_ID('[Service].[OLAPview_Technician]') IS NOT NULL
	DROP VIEW [Service].[OLAPview_Technician]
GO

CREATE VIEW [Service].[OLAPview_Technician]
AS
	SELECT 
		u.FullName,
		u.Id
	FROM 
		[Service].[Technician] t
		INNER JOIN [admin].[User] u
			ON t.[UserId] = u.id

GO


