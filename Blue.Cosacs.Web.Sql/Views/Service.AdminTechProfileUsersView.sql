IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'AdminTechProfileUsersView'
		   AND ss.name = 'Service')
DROP VIEW  service.AdminTechProfileUsersView
Go

CREATE VIEW Service.AdminTechProfileUsersView
AS
SELECT UserId FROM Admin.AdditionalProfile
INNER JOIN Admin.AdditionalUserProfile ON Admin.AdditionalProfile.Id = Admin.AdditionalUserProfile.ProfileId
WHERE name = 'Technician'
