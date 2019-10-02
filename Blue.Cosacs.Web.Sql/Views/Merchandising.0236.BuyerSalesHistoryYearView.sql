IF EXISTS (SELECT * FROM sys.views WHERE name = 'BuyerSalesHistoryYearView')
DROP VIEW [Merchandising].[BuyerSalesHistoryYearView]
GO

CREATE VIEW [Merchandising].[BuyerSalesHistoryYearView]
AS

--This Year
SELECT 
	'This Year' as [Year], 
	CASE 
		WHEN DATEPART(month, GETDATE()) < 4 THEN DATEPART(year, GETDATE()) -1
		ELSE DATEPART(year, GETDATE())
	END as [NumericYear], 
	CASE 
		WHEN DATEPART(month, GETDATE()) < 4 THEN CONVERT(datetime, CONVERT(varchar, DATEPART(year, GETDATE()) -1) + '-04-01 00:00:00')
		ELSE CONVERT(datetime, CONVERT(varchar, DATEPART(year, GETDATE())) + '-04-01 00:00:00')
	END as StartDate, 
	CASE 
		WHEN DATEPART(month, GETDATE()) < 4 THEN CONVERT(datetime, CONVERT(varchar, DATEPART(year, GETDATE())) + '-03-31 23:59:59')
		ELSE CONVERT(datetime, CONVERT(varchar, DATEPART(year, GETDATE())+1) + '-03-31 23:59:59')
	END as EndDate
--Last Year
UNION 

SELECT 
	'Last Year' as [Year], 
	CASE 
		WHEN DATEPART(month, dateadd(year, -1, GETDATE())) < 4 THEN DATEPART(year, dateadd(year, -1, GETDATE())) -1
		ELSE DATEPART(year, dateadd(year, -1, GETDATE()))
	END as [NumericYear], 
	CASE 
		WHEN DATEPART(month, dateadd(year, -1, GETDATE())) < 4 THEN CONVERT(datetime, CONVERT(varchar, DATEPART(year, dateadd(year, -1, GETDATE())) -1) + '-04-01 00:00:00')
		ELSE CONVERT(datetime, CONVERT(varchar, DATEPART(year, dateadd(year, -1, GETDATE()))) + '-04-01 00:00:00')
	END as StartDate, 
	CASE 
		WHEN DATEPART(month, dateadd(year, -1, GETDATE())) < 4 THEN CONVERT(datetime, CONVERT(varchar, DATEPART(year, dateadd(year, -1, GETDATE()))) + '-03-31 23:59:59')
		ELSE CONVERT(datetime, CONVERT(varchar, DATEPART(year, dateadd(year, -1, GETDATE()))+1) + '-03-31 23:59:59')
	END as EndDate
	GO
