IF OBJECT_ID('Merchandising.ImportDateDimension') IS NOT NULL
	DROP PROCEDURE Merchandising.ImportDateDimension
GO 

CREATE PROCEDURE Merchandising.ImportDateDimension as 
BEGIN


TRUNCATE TABLE Merchandising.Dates


DECLARE @DateFrom date, @DateTo date;
SET @DateFrom = (SELECT MIN(startdate) From Merchandising.PeriodData);
SET @DateTo = (SELECT MAX(enddate) FROM Merchandising.PeriodData);
-------------------------------
WITH T(date)
AS
(
SELECT
	@DateFrom UNION ALL SELECT
	DATEADD(DAY, 1, T.date)
FROM T
WHERE T.date < @DateTo)

INSERT INTO Merchandising.Dates
SELECT
	CONVERT(VARCHAR(8), t.date, 112) AS DateKey,
	t.date AS FullDateAlternateKey,
	DATEDIFF(DAY, startdate, t.date) + 1 AS DayNumberOfWeek,
	DATENAME(DW, t.date) AS DayNameOfWeek,
	DAY(t.date) AS DayNumberOfMonth,
	CASE
		WHEN DATEPART(MONTH, t.date) < 4 THEN DATEDIFF(DAY, CONVERT(DATE, CONVERT(VARCHAR, DATEPART(YEAR, t.date) - 1) + '-04-01'), t.date) + 1
		ELSE DATEDIFF(DAY, CONVERT(DATE, CONVERT(VARCHAR, DATEPART(YEAR, t.date)) + '-04-01'), t.date) + 1
	END AS DayOfFiscalYear,
	DATEDIFF(DAY, CONVERT(DATE, CONVERT(VARCHAR, DATEPART(YEAR, t.date)) + '-01-01'), t.date) AS DayOfCalendarYear,
	DATEPART(WEEK, t.date) AS CalendarWeek,
	[week] AS FiscalWeek,
	DATENAME(M, t.date) AS MonthName,
	DATEPART(m, t.date) AS CalendarPeriod,
	[period] AS FisacalPeriod,
	DATEPART(yyyy, t.date) AS CalendarYear,
	CASE
		WHEN DATEPART(MONTH, t.date) < 4 THEN DATEPART(YEAR, t.date) - 1
		ELSE DATEPART(YEAR, t.date) 
	END AS FiscalYear
FROM T
INNER JOIN merchandising.perioddata p
	ON t.date BETWEEN p.startdate AND p.enddate
OPTION (MAXRECURSION 0);

END