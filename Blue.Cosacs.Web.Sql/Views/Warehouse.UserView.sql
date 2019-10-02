IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'UserView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.[UserView]
GO


CREATE VIEW  Warehouse.[UserView]
AS
SELECT * FROM Admin.[User]
GO


