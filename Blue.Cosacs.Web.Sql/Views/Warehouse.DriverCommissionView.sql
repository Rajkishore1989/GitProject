
IF NOT (SELECT OBJECT_ID('Warehouse.DriverCommissionView')) IS NULL 
	DROP VIEW Warehouse.DriverCommissionView
GO

CREATE VIEW [Warehouse].[DriverCommissionView] AS
	SELECT
		MAX(val.Id) AS Id,
		MAX(Val.ScheduleId) AS ScheduleId,
		MAX(val.StockBranch) AS StockBranch, 
		MAX(val.ScheduleOn) AS ScheduleOn,
		MAX(val.DeliveredOn) AS DeliveredOn,
		CONVERT(VarChar, val.PickingId) AS PickingId,
		MAX(val.LineTotal) AS LineTotal,
		MAX(val.ExportedOn) AS ExportedOn ,
		MAX(val.ExportedBy) AS ExportedBy,
		MAX(val.DriverId) as DriverId,				--IP - 28/06/12 - #10530
		MAX(val.DriverName) as DriverName			--IP - 28/06/12 - #10530
	FROM
	(
		SELECT 
			ISNULL(d.Id, 0) AS id,
			l.Id AS ScheduleId,
			b.StockBranch,
			l.CreatedOn AS ScheduleOn,
			l.ConfirmedOn AS DeliveredOn,
			CONVERT(VARCHAR, b.PickingId) AS PickingId,
			b.DeliverQuantity * b.UnitPrice AS LineTotal,
			d.CreatedOn AS ExportedOn,
			d.CreatedBy AS ExportedBy,
			wd.Id AS DriverId,
			wd.Name as DriverName
		FROM 
			Warehouse.Booking b
			INNER JOIN Warehouse.[Load] l
				ON b.ScheduleId = l.Id
			INNER JOIN Warehouse.Driver wd ON l.DriverId = wd.Id --IP - 28/06/12 - #10530
			LEFT JOIN Warehouse.DriverCommission d
				ON d.Id = l.DriverCommissionId
		WHERE 
			ISNULL(b.DeliveryRejected, 1) =  0

	) Val
	GROUP BY	
		val.PickingId
GO

