IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianAvailableRequestView]'))
DROP VIEW  service.TechnicianAvailableRequestView
Go

CREATE VIEW Service.TechnicianAvailableRequestView
AS

	SELECT  Id as RequestId,
            CreatedOn ,
	        Type ,
	        InvoiceNumber ,
	        CustomerId ,
	        CustomerTitle ,
	        CustomerFirstName ,
	        CustomerLastName ,
	        CustomerAddressLine1 ,
	        CustomerAddressLine2 ,
	        CustomerAddressLine3 ,
	        CustomerPostcode ,
	        Item ,
	        ItemSupplier
	FROM Service.Request R
	WHERE NOT EXISTS (SELECT * 
					  FROM Service.TechnicianBooking T
					  WHERE T.RequestId = R.Id
                      AND T.reject = 0)
	and r.IsClosed =0			-- jec 10/01/13 - only open requests
	
GO