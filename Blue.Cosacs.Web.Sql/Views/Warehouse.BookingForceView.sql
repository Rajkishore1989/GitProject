IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'BookingForceView'
		   AND ss.name = 'Warehouse')
DROP VIEW  Warehouse.BookingForceView
GO

CREATE VIEW Warehouse.BookingForceView
AS
SELECT  B.Id ,
        CustomerName ,
        Account = Acctno,
        Address = AddressLine1 + CHAR(13) + AddressLine2 + CHAR(13) + AddressLine3 + CHAR(13) + PostCode ,
        StockBranch ,
        DeliveryBranch ,
        StockBranchName = StockBranch.branchname,
        DeliveryBranchName = DelBranch.branchname ,
        DeliveryOrCollection ,
        --Warehouse.SolrDateFN(DeliveryOrCollectionDate) AS DeliveryOrCollectionDate,		-- #14547 #14556 re-instated
		DeliveryOrCollectionDate,		-- #14547
        ItemNo ,
        ItemId ,
        ItemUPC ,
        ProductDescription ,
        ProductCategory ,
        CurrentQuantity AS Quantity ,
        DeliveryZone ,
        Warehouse.SolrDateFN(OrderedOn) AS OrderedOn,
        Damaged,
        PickingId AS PickListNo,
        P.ConfirmedOn AS PickingConfirmedOn,
        ScheduleId AS ScheduleNo,
        TruckId AS Truck,
        OriginalId AS OriginalId,
        Exception,      
        c.UserId AS CancelUser,
        c.Date AS CancelDate,              
        PATH,
        DeliveryRejected,
        Fascia,
        PickUp,
		B.DeliveryOrCollectionSlot			--#14601      
        FROM Warehouse.Booking B
        LEFT OUTER JOIN Branch DelBranch ON B.DeliveryBranch = DelBranch.branchno
        LEFT OUTER JOIN Branch StockBranch ON B.StockBranch = StockBranch.branchno
        left outer join Warehouse.Picking P on B.PickingId = P.Id
        LEFT OUTER JOIN Warehouse.Cancellation c ON b.id = c.id      
        
        
        
        
        
