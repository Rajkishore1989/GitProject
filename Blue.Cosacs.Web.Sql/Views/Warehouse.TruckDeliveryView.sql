IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[TruckDeliveryView]'))
DROP VIEW [Warehouse].TruckDeliveryView
GO

CREATE VIEW [Warehouse].TruckDeliveryView
AS
SELECT T.Id, T.Name, T.Branch, ISNULL(COUNT(B.TruckId), 0) AS [Count]    
FROM Warehouse.Truck T    
LEFT JOIN Warehouse.Booking B ON T.Id = B.TruckId 
								 AND ScheduleId IS NOT NULL
								 AND ScheduleRejected = 0
GROUP BY T.Id, T.Name , T.Branch  
GO

