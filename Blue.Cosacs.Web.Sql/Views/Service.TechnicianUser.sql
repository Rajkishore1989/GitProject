IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianUser]'))
DROP VIEW  service.TechnicianUser
Go

CREATE VIEW Service.TechnicianUser
AS
SELECT t.*, u.FullName FROM Service.Technician t
INNER JOIN admin.[User] u ON t.UserId = u.Id
WHERE u.Locked != 1
