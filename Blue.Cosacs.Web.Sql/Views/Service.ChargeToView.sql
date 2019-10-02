IF OBJECT_ID('Service.ChargeToView') IS NOT NULL
	DROP VIEW Service.ChargeToView
GO

CREATE VIEW Service.ChargeToView
AS
	SELECT 
		Type 
	FROM 
		Service.Charge 
	GROUP BY Type