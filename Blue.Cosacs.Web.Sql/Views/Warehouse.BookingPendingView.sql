IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[BookingPendingView]'))
DROP VIEW [Warehouse].[BookingPendingView]
GO

CREATE VIEW Warehouse.BookingPendingView
AS
WITH Merch -- This a hack. Need for release. Fix later -- Paulo.
AS
(select SKU, StockOnHand, l.SalesId from Merchandising.ProductStockLevel pl
INNER JOIN Merchandising.Product p on p.Id = pl.ProductId
INNER JOIN Merchandising.Location l on l.Id = pl.LocationId)
	SELECT  B.AcctNo ,
	        B.AddressLine1 ,
	        B.AddressLine2 ,
	        B.AddressLine3 ,
	        B.AssemblyReq ,
	        B.Comment ,
	        B.ContactInfo ,
	        B.CurrentQuantity ,
	        B.CustomerName ,
	        B.Damaged ,
	        B.DeliverQuantity ,
	        B.DeliveryBranch ,
	        B.DeliveryConfirmedBy ,
	        B.DeliveryOrCollection ,
	        B.DeliveryOrCollectionDate ,
	        B.DeliveryRejected ,
	        B.DeliveryRejectedReason ,
	        B.DeliveryRejectionNotes ,
	        B.DeliveryZone ,
	        B.Exception ,
	        B.Express ,
	        B.Id ,
	        B.ItemId ,
	        B.ItemNo ,
	        B.ItemUPC ,
			CONVERT(datetime, SWITCHOFFSET(CONVERT(datetimeoffset, b.OrderedOn), DATENAME(TzOffset, SYSDATETIMEOFFSET()))) AS OrderedOn,
	        B.OriginalId ,
	        B.Path ,
	        B.PickingAssignedBy ,
	        B.PickingAssignedDate ,
	        B.PickingComment ,
	        B.PickingId ,
	        B.PickingRejected ,
	        B.PickingRejectedReason ,
	        B.PickQuantity ,
	        B.PostCode ,
	        B.ProductArea ,
	        B.ProductBrand ,
	        B.ProductCategory ,
	        B.ProductDescription ,
	        B.ProductModel ,
	        B.Quantity ,
	        B.RepoItemId ,
	        B.ScheduleComment ,
	        B.ScheduleId ,
	        B.ScheduleQuantity ,
	        B.ScheduleRejected ,
	        B.ScheduleRejectedReason ,
	        B.ScheduleSequence ,
	        B.StockBranch ,
	        B.TruckId ,
	        B.UnitPrice,
	        B.Fascia,
	        B.PickUp,
	        B.NonStockServiceType,
	        B.NonStockServiceItemNo,
	        B.NonStockServiceDescription,
	        c.UserId as CancelUser,
			c.date as CancelDate,
			c.reason as CancelReason,
			Convert(float,ISNULL(Merch.StockOnHand,0)) AS StockOnHand,  --#12233
            c.id as CancellationId,
			B.DeliveryOrCollectionSlot,
			B.ReceivingLocation
	FROM 
		Warehouse.Booking B 
		LEFT JOIN Warehouse.Cancellation c ON B.Id = c.Id
		LEFT JOIN Merch on Merch.SalesId = B.StockBranch AND Merch.SKU = B.ItemNo
GO
