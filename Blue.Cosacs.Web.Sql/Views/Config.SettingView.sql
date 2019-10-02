IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Config].[SettingView]'))
DROP VIEW  Config.SettingView
Go

CREATE VIEW Config.SettingView 
AS
SELECT ParameterId, ParameterCategory, Name, Value, Type, Precision, OptionCategory, OptionListName, Description, CodeName
FROM dbo.CountryMaintenance

go