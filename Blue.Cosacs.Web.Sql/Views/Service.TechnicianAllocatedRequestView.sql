IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianAllocatedRequestView]'))
DROP VIEW  service.TechnicianAllocatedRequestView
Go

CREATE VIEW Service.TechnicianAllocatedRequestView
AS

	SELECT  t.Id,
            CreatedOn ,
	        R.Type ,
	        InvoiceNumber ,
	        CustomerId ,
	        CustomerTitle ,
	        CustomerFirstName ,
	        CustomerLastName ,
	        CustomerAddressLine1 ,
	        CustomerAddressLine2 ,
	        CustomerAddressLine3 ,
	        CustomerPostcode ,
	        CustomerNotes ,
	        ItemId ,
	        Item ,
	        ItemSupplier ,
	        UserId ,
	        RequestId ,
	        Date ,
	        Slot ,
	        SlotExtend ,
	        Reject
	FROM Service.Request R
	INNER JOIN Service.TechnicianBooking T ON r.id = t.RequestId
GO