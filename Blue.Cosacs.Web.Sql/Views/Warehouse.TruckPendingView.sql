IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[TruckPendingView]'))
DROP VIEW [Warehouse].[TruckPendingView]
GO

CREATE VIEW [Warehouse].[TruckPendingView]
AS
WITH PendingCount AS (
	SELECT T.Id AS TruckId, ISNULL(COUNT(B.TruckId), 0) AS [Count]
	FROM Warehouse.Truck T
	LEFT JOIN Warehouse.Booking B ON T.Id = B.TruckId
									 AND ScheduleRejected IS NULL
									 AND b.currentQuantity > 0
									 AND b.EXCEPTION = 0
	LEFT OUTER JOIN Warehouse.Cancellation can on ISNULL(b.id, b.OriginalId) = can.id
	WHERE can.Date IS NULL
	GROUP BY T.Id
	)
SELECT T.Id, T.Name, T.Branch, ISNULL([Count], 0) AS [Count]
FROM Warehouse.Truck T
LEFT OUTER JOIN PendingCount ON T.Id = TruckId

GO