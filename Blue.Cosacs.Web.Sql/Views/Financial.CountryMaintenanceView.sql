IF OBJECT_ID('Financial.CountryMaintenanceView') IS NOT NULL
	DROP VIEW Financial.CountryMaintenanceView
GO

CREATE VIEW Financial.CountryMaintenanceView
AS
	SELECT 
		ParameterID,
		CountryCode, 
		ParameterCategory, 
		Name, 
		Value, 
		[Type], 
		[Precision], 
		OptionCategory, 
		OptionListName, 
		[Description], 
		CodeName 
	FROM 
		dbo.CountryMaintenance 
GO