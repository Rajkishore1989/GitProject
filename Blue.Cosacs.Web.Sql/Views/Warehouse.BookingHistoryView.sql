IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'BookingHistoryView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.BookingHistoryView
GO

CREATE VIEW [Warehouse].[BookingHistoryView]
AS
      
SELECT			b.Id,
                B.truckId,
                b.pickingID,
                b.ScheduleID,
				b.OrderedOn AS BookingOrderedOn,
				b.DeliveryOrCollection,
				b.DeliveryOrCollectionDate,
                b.PickQuantity ,
                isnull(b.PickingComment,'') as  PickingComment,
                b.PickingRejectedReason ,
                b.PickingRejected ,
                isnull(b.ScheduleComment,'') as ScheduleComment,
                b.ScheduleSequence ,
                P.CreatedOn as PickingCreatedOn ,
                p.ConfirmedOn AS PickingConfirmedOn,
                isnull(P.Comment,'') AS PickListComment,
				CONVERT(datetime, SWITCHOFFSET(CONVERT(datetimeoffset, PickedOn), DATENAME(TzOffset, SYSDATETIMEOFFSET()))) as PickedOn, --#12979
                L.CreatedOn AS ScheduleCreatedOn,
                L.DriverId ,
                D.Name AS DriverName ,
                b.PickingAssignedBy ,
                PickedAssignedBy.FullName AS PickingAssignedByName,
                b.PickingAssignedDate,
                PickedBy ,
                PickedBy.FullName AS PickedByName,
                P.Createdby AS PickedCreatedBy,
                PickedCreatedBy.FullName AS PickedCreatedByName,
                CheckedBy ,
                PickedCheckedBy.FullName AS PickedCheckedByName,
                p.ConfirmedBy ,
                PickedConfirmedBy.FullName AS PickedConfirmedByName,
                L.Createdby AS LoadCreatedBy,
                LoadCreatedBy.FullName AS LoadCreatedByName,
                b.Exception,
                b.OriginalId,
				be.Exception as ChildException,
				be.Id as ChildId,
				be.OrderedOn as ExceptionCreatedOn,
                c.UserId AS CancelUser,
                c.Reason AS CancelReason,
                c.date AS CancelDate,
				--case when b.PickUp = 0 then  l.ConfirmedOn
				--	else b.DeliveryConfirmedDate end AS DeliveryConfirmedOn,
				b.DeliveryConfirmedOnDate AS DeliveryConfirmedOn, --#15498
                --CASE WHEN b.PickUp = 0 THEN l.confirmedBy ELSE b.DeliveryConfirmedBy END AS DeliveryConfirmedBy ,	--#10792
                --CASE WHEN b.PickUp = 0 THEN DeliveryConfirm.FullName ELSE PickUpDeliveryConfirm.FullName END AS DeliveryConfirmedByName,	--#10792
				b.DeliveryConfirmedBy AS DeliveryConfirmedBy ,	--#10792
                ConfirmedBy.FullName AS DeliveryConfirmedByName,	--#10792
                b.DeliverQuantity,
                b.DeliveryRejected,
                isnull(b.DeliveryRejectionNotes,'') as DeliveryRejectionNotes,
                b.DeliveryRejectedReason,
                b.Quantity,
                b.ScheduleQuantity,
                b.CurrentQuantity,
                BP.PickingRejected as ParentPickingRejected,
                BP.ScheduleRejected as ParentScheduleRejected,
                BP.DeliveryRejected as ParentDeliveryRejected,
                B.BookedBy,
                T.Name as TruckName,
                CreatedBy.FullName AS BookedByName,
                b.PickUpNotePrintedBy,
                PickUpPrintConfirm.FullName AS PickUpNotePrintedByName,
				b.PickUpDatePrinted as PickUpDatePrinted,
                b.PickUp,
				b.DeliveryConfirmedDate as DeliveryConfirmedDate,
				b.ScheduleRejectedDate,		--#15512
				ScheduleRejectedBy.FullName AS ScheduleRejectedByName, --#15512
				b.ScheduleRejectedBy,		 --#15512
				b.ScheduleRejectedReason	 --#15512
                FROM Warehouse.Booking B
        LEFT OUTER JOIN Warehouse.Picking P ON B.PickingId = P.Id
        LEFT OUTER JOIN Warehouse.Load L ON B.ScheduleId = L.Id
        LEFT OUTER JOIN Warehouse.Driver D ON L.DriverId = D.Id
        LEFT OUTER JOIN Admin.[User] PickedAssignedBy ON PickedAssignedBy.id = B.PickingAssignedBy
        LEFT OUTER JOIN Admin.[User]  PickedBy ON PickedBy.id = PickedBy
        LEFT OUTER JOIN Admin.[User]  PickedCreatedBy ON PickedCreatedBy.id = P.Createdby
        LEFT OUTER JOIN Admin.[User]  PickedCheckedBy ON PickedCheckedBy.id = P.CheckedBy
        LEFT OUTER JOIN Admin.[User]  PickedConfirmedBy ON PickedConfirmedBy.id = P.ConfirmedBy
        LEFT OUTER JOIN Admin.[User]  LoadCreatedBy ON LoadCreatedBy.id = L.CreatedBy
        --LEFT OUTER JOIN Admin.[User]  DeliveryConfirm ON DeliveryConfirm.id = L.confirmedBy
		LEFT OUTER JOIN Admin.[User]  ConfirmedBy ON ConfirmedBy.id = b.DeliveryConfirmedBy
        LEFT OUTER JOIN Admin.[User]  CreatedBy ON CreatedBy.id = B.BookedBy
        --LEFT OUTER JOIN Admin.[User]  PickUpDeliveryConfirm ON PickUpDeliveryConfirm.Id = b.DeliveryConfirmedBy	-- #10792
        LEFT OUTER JOIN Admin.[user]  PickUpPrintConfirm ON PickUpPrintConfirm.Id = b.PickUpNotePrintedBy
		LEFT OUTER JOIN Admin.[User] ScheduleRejectedBy ON ScheduleRejectedBy.id = B.ScheduleRejectedBy					--#15512
        LEFT OUTER JOIN warehouse.cancellation c ON c.id = b.id   
        LEFT OUTER JOIN Warehouse.Booking BP ON BP.ID = B.OriginalId
		left outer join Warehouse.Booking be on b.Id = be.OriginalId
        LEFT OUTER JOIN Warehouse.Truck T ON B.TruckId = T.ID
