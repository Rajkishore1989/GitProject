IF OBJECT_ID('service.OLAPview_ServiceCharge') IS NOT NULL
	DROP VIEW [service].OLAPview_ServiceCharge
GO

CREATE VIEW [service].OLAPview_ServiceCharge
AS
	SELECT 
		id AS ChargeId
		,RequestId
		,Type AS ChargeType 
		,Tax
		,Value
	FROM 
		Service.Charge
GO