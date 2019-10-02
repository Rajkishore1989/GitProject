IF OBJECT_ID('[Config].OLAPview_ServiceTechRejectReasons') IS NOT NULL
	DROP VIEW [Config].OLAPview_ServiceTechRejectReasons
GO

CREATE VIEW [Config].OLAPview_ServiceTechRejectReasons
AS
	SELECT 
		Items AS Reason
	FROM 
		config.GetServiceTechRejectReasons()
	UNION 
	SELECT 
		Reason 
	FROM 
		service.technicianbookingreject



