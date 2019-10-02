IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[RequestIndexView]'))
DROP VIEW  service.RequestIndexView
Go

CREATE VIEW Service.RequestIndexView
AS
SELECT r.Id ,
        r.CreatedOn ,
        r.CreatedBy ,
        r.Branch ,
        BranchNameLong = b.branchname + ' ' + CONVERT(VARCHAR(10),b.branchno),
        r.Type ,
        r.State ,
        r.Account,
        r.CustomerId ,
        r.CustomerTitle ,
        r.CustomerFirstName ,
        r.CustomerLastName ,
        r.CustomerAddressLine1 ,
        r.CustomerAddressLine2 ,
        r.CustomerAddressLine3 ,
        r.CustomerPostcode ,
        r.CustomerNotes ,
        r.ItemId ,
        r.ItemAmount ,
        r.ItemSoldBy ,
        r.Item ,
        r.ItemSupplier ,
        r.InvoiceNumber,
        r.ItemSerialNumber ,
        r.TransitNotes ,
        r.CreatedById ,
        r.LastUpdatedUser ,
        r.LastUpdatedUserName ,
        r.LastUpdatedOn ,
        r.ItemNumber ,
        r.Printed ,
		r.RepairLimitWarning,
		r.ResolutionDate,
        b.branchname + ' ' + CONVERT(VARCHAR(10),b.branchno) AS HomeBranchName
FROM Service.Request r
INNER JOIN dbo.branch b ON b.branchno = r.Branch
GO
