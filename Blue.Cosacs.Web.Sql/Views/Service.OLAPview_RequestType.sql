IF OBJECT_ID('service.OLAPview_RequestType') IS NOT NULL
	DROP VIEW service.OLAPview_RequestType
GO

CREATE VIEW service.OLAPview_RequestType
AS 
	SELECT 'Internal Installation' AS Name, 'II' AS Code
	UNION ALL
	SELECT 'External Customer Installation' AS Name, 'IE' AS Code
	UNION ALL
	SELECT 'Stock Repair' AS Name, 'S' AS Code
	UNION ALL
	SELECT 'Service Request Internal' AS Name, 'SI' AS Code
	UNION ALL
	SELECT 'Service Request External' AS Name, 'SE' AS Code
GO