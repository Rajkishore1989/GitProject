IF OBJECT_ID('Financial.GetCountryCode') IS NOT NULL
	DROP PROCEDURE Financial.GetCountryCode
GO

CREATE PROCEDURE Financial.GetCountryCode
AS
	SELECT RTRIM(LTRIM(c.countrycode)) FROM dbo.country c