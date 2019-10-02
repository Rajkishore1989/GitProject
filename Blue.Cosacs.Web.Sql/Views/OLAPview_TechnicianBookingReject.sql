IF OBJECT_ID('service.OLAPview_TechnicianBookingReject') IS NOT NULL
	DROP VIEW service.OLAPview_TechnicianBookingReject
GO

CREATE VIEW service.OLAPview_TechnicianBookingReject
AS
	SELECT 
		t.Id,
		t.RequestId,
		t.Date,
		t.TechincianId,
		t.Reason	
	FROM 
		service.technicianbookingreject t

