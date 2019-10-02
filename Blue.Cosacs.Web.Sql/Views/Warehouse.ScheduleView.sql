
IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[ScheduleView]'))
DROP VIEW [Warehouse].[ScheduleView]
GO

CREATE VIEW [Warehouse].[ScheduleView]  
AS  
SELECT         
        B.ScheduleID ,  
        B.Id AS BookingId ,  
        B.PickingComment,          
        B.PickingId AS PickingId,  
        B.CustomerName ,  
			 dbo.custaddress.DELTitleC + ' ' + dbo.custaddress.DELFirstName + ' ' + dbo.custaddress.DELLastName AS DName,
        B.AddressLine1 ,  
        B.AddressLine2 ,  
        B.AddressLine3 ,  
        B.PostCode ,  
        B.StockBranch ,  
        B.DeliveryBranch ,  
        B.DeliveryOrCollection ,  
        B.DeliveryOrCollectionDate ,  
        B.ItemNo ,  
        B.ItemId ,  
        B.ItemUPC ,  
        B.ProductArea ,  
        B.ProductCategory ,  
        B.ProductDescription ,  
        B.ProductBrand ,  
        B.ProductModel ,  
        B.CurrentQuantity,  
        B.RepoItemId,  
        B.AssemblyReq,  
        B.Damaged,  
        B.ContactInfo,  
        B.OrderedOn,  
        BR1.branchname AS DeliveryBranchName,
        T.Id AS TruckId,  
        T.Name AS TruckName,
        b.DeliveryZone,
        b.ScheduleQuantity											--    #11484  
FROM Warehouse.Booking B 
INNER JOIN branch BR1 ON BR1.branchno = B.DeliveryBranch  
INNER JOIN Warehouse.Truck T ON T.Id = B.TruckId  
inner join dbo.custacct AS custadd ON custadd.acctno = B.AcctNo LEFT OUTER JOIN
dbo.custaddress ON custadd.custid = dbo.custaddress.custid AND (dbo.custaddress.cusaddr1 = B.AddressLine1 OR
dbo.custaddress.cusaddr2 = B.AddressLine2)

GO

