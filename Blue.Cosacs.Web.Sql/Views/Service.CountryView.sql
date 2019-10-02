IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[CountryView]'))
DROP VIEW  service.CountryView
Go

CREATE VIEW Service.CountryView
AS
SELECT * from dbo.country