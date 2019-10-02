IF OBJECT_ID('Report.TechnicianRejectionReport') IS NOT NULL
	DROP PROCEDURE Report.TechnicianRejectionReport
GO

CREATE PROCEDURE Report.TechnicianRejectionReport
	@FirstDate Date,
	@LastDate Date
AS
	SET NOCOUNT ON 

	SELECT        
		CONVERT(varchar, r.Datelogged, 103) AS [Date Logged],
		CONVERT(varchar, r.Dateallocated, 103) AS [Date Allocated],
		CONVERT(varchar, [Date], 103) AS [Date Rejected], 
		CASE
			WHEN r.RequestType = 'SE' THEN 'Service External'
			WHEN r.RequestType = 'SI' THEN 'Service Internal'
			WHEN r.RequestType = 'S' THEN 'Stock Repair'
			WHEN r.RequestType = 'II' THEN 'Internal Installation'
			WHEN r.RequestType = 'IE' THEN 'External Installation'
		END AS [Request Type],
		r.Servicerequest AS [Request Number],
		p.Category AS [Product Category],
		t.FullName AS [Technician Name],
		tr.Reason AS [Rejection Reason]
	FROM
		Service.OLAPview_TechnicianBookingReject tr
		INNER JOIN Service.OLAPview_ServiceRequest r
			ON tr.RequestId = r.Servicerequest
		LEFT JOIN Olapview_Product p
			ON r.Productid = p.Productid
		INNER JOIN Service.OLAPview_Technician t
			ON tr.TechincianId = t.Id
	WHERE
		CONVERT(DATE, r.Datelogged) BETWEEN @FirstDate AND @LastDate
