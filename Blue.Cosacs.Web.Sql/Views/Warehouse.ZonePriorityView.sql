IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.name = 'ZonePriorityView'
		   AND ss.name = 'Warehouse')
BEGIN
	DROP VIEW Warehouse.ZonePriorityView
END
GO	   

CREATE VIEW Warehouse.ZonePriorityView
AS
SELECT * FROM code
WHERE category = 'zone'
GO

