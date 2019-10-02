
-- #13677 New
-- This view is also created in Warehouse.PickingView as is dependency
-- any changes made to this view must be replicated in PickingView source

IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'TruckConfirmedView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.TruckConfirmedView
GO

CREATE VIEW Warehouse.TruckConfirmedView
AS

select TruckId,max(ConfirmedOn) as LastConfirmedOn  
from warehouse.booking b inner join  warehouse.load l on ScheduleId=l.id
group by TruckId

