IF EXISTS ( SELECT * FROM sysobjects
			WHERE name = 'AdminUserView')
DROP VIEW  service.AdminUserView
Go

CREATE VIEW Service.AdminUserView
AS
SELECT * FROM Admin.[User]