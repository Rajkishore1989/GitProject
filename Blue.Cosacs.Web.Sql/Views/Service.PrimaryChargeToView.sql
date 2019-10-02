IF OBJECT_ID('Service.PrimaryChargeToView') IS NOT NULL
	DROP VIEW Service.PrimaryChargeToView
GO

CREATE VIEW Service.PrimaryChargeToView
AS
	SELECT DISTINCT TOP 100 PERCENT  
		r.ResolutionPrimaryCharge 
	FROM 
		Service.Request r
	WHERE
		r.ResolutionPrimaryCharge IS NOT NULL
	ORDER BY 
		r.ResolutionPrimaryCharge 