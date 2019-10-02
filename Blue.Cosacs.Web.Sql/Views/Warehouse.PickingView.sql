
-- Running combined as Picking View Depends on Picklist View. And PickListView depends on TruckConfirmedView

IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'TruckConfirmedView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.TruckConfirmedView
GO

CREATE VIEW Warehouse.TruckConfirmedView				-- #13677
AS

select TruckId,max(ConfirmedOn) as LastConfirmedOn  
from warehouse.booking b inner join  warehouse.load l on ScheduleId=l.id
group by TruckId

go

IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'PickListView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.PickListView
GO

CREATE VIEW Warehouse.PickListView
AS
WITH Merch -- This a hack. Need for release. Fix later -- Paulo.
AS
(select SKU, StockOnHand, l.SalesId from Merchandising.ProductStockLevel pl
INNER JOIN Merchandising.Product p on p.Id = pl.ProductId
INNER JOIN Merchandising.Location l on l.Id = pl.LocationId)
SELECT 
		P.Id,
		P.CreatedBy,
        P.CreatedOn ,
        P.PickedBy ,
        P.CheckedBy ,
        P.ConfirmedBy ,
        P.ConfirmedOn ,
        P.Comment AS PickListComment,
        B.Comment AS ItemComment,
        B.ID AS BookingId,
        B.PickingComment,      
        B.AcctNo,
        B.CustomerName ,
        B.AddressLine1 ,
        B.AddressLine2 ,
        B.AddressLine3 ,
        B.PostCode ,
        B.StockBranch ,
        B.DeliveryBranch ,
        B.DeliveryOrCollection ,
        B.DeliveryOrCollectionDate ,	-- #14547
        B.ItemNo ,
        B.ItemId ,
        B.ItemUPC ,
        B.ProductArea ,
        B.ProductCategory ,
        B.ProductDescription ,
        B.ProductBrand ,
        B.ProductModel ,
        B.PickQuantity , -- Use this one in case of reprint.
        B.Quantity,
        B.RepoItemId,
        B.AssemblyReq,
        B.Damaged,
        B.ContactInfo,
		CONVERT(datetime, SWITCHOFFSET(CONVERT(datetimeoffset, B.OrderedOn), DATENAME(TzOffset, SYSDATETIMEOFFSET()))) AS OrderedOn,		-- #13458
		B.PickingRejected,      
		B.ScheduleRejected,
		B.ScheduleRejectedReason,
		B.ScheduleComment,
		B.ScheduleQuantity,
        B.UnitPrice,
        T.Id AS TruckId,
        T.Name AS TruckName,
        B.OriginalId,
        B.CurrentQuantity,
        B.AddressNotes,			-- #12367
        B.ReceivingLocation,
		C1.FullName AS CreatedByName,
		C2.FullName AS PickedByName,
		C3.FullName AS CheckedByName,
		C4.FullName AS ConfirmedByName,
		B.ScheduleId,
		B.NonStockServiceType,
		B.NonStockServiceItemNo,
		B.NonStockServiceDescription,
		can.UserId as CancelUser,
		can.date as CancelDate,
		can.reason as CancelReason,
		B.Express,
		CONVERT(float, ISNULL(Merch.StockOnHand,0)) AS StockOnHand,			--#12233
		tc.LastConfirmedOn,						-- #13677
		c1.[Login] as CreatedByLogin,			-- #10199
		C2.[Login] AS PickedByLogin,			-- #10199
		C3.[Login] AS CheckedByLogin,			-- #10199
		C4.[Login] AS ConfirmedByLogin,			-- #10199
		B.DeliveryOrCollectionSlot				--#14601
		
		
FROM warehouse.Picking P
INNER JOIN Warehouse.Booking B ON P.Id = B.PickingID
INNER JOIN Warehouse.Truck T ON T.Id = B.TruckId
LEFT JOIN Admin.[User] C1 ON C1.id = P.CreatedBy
LEFT JOIN Admin.[User] C2 ON C2.id = P.PickedBy
LEFT JOIN Admin.[User] C3 ON C3.id = P.CheckedBy
LEFT JOIN Admin.[User] C4 ON C4.id = P.ConfirmedBy
LEFT OUTER JOIN Warehouse.Cancellation can on ISNULL(B.id,B.OriginalId)=can.id					--#13657
left outer join Warehouse.TruckConfirmedView tc on B.TruckId=tc.TruckId								-- #13677
   LEFT OUTER JOIN Merch ON b.itemno = Merch.SKU AND b.StockBranch = Merch.SalesId
GO






IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'PickingView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.PickingView
GO

CREATE VIEW Warehouse.PickingView
AS

SELECT 
	P.Id ,
	P.CreatedBy ,
	P.CheckedBy,
	P.ConfirmedBy,
	P.PickedBy,
	P.CreatedOn ,
	P.ConfirmedOn,
	P.PickedOn,
	
	PL.DeliveryBranch AS BranchNumber,
	
	B.BranchName,
	
	C1.FullName AS CreatedByName,
	C2.FullName AS CheckedByName,
	C3.FullName AS PickedByName,
	C4.FullName AS ConfirmedByName				-- #10702
	
FROM Warehouse.Picking P
LEFT OUTER JOIN Admin.[User] C1 ON C1.id = P.Createdby  
LEFT OUTER JOIN Admin.[User] C2 ON C2.id = P.CheckedBy 
LEFT OUTER JOIN Admin.[User] C3 ON C3.id = P.PickedBy 
LEFT OUTER JOIN Admin.[User] C4 ON C4.id = P.ConfirmedBy
LEFT OUTER JOIN (SELECT DISTINCT Id, DeliveryBranch FROM Warehouse.PicklistView) PL ON PL.Id = P.Id
LEFT OUTER JOIN dbo.branch B ON B.branchno = PL.DeliveryBranch
GO
