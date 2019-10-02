IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianNameView]'))
DROP VIEW  service.TechnicianNameView
Go

CREATE VIEW Service.TechnicianNameView 
AS
SELECT FullName, t.UserId FROM Service.Technician t
INNER JOIN admin.[User]  a ON t.UserId = a.Id
