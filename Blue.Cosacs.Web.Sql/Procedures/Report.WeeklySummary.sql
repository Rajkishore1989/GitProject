IF OBJECT_ID('Report.WeeklySummary') IS NOT NULL
    DROP PROCEDURE Report.WeeklySummary
GO

CREATE PROCEDURE Report.WeeklySummary
    @FirstMonthYear Int, -- month from a financial date
    @FirstDayYear   Int, -- day from a financial date
    @Year           Int,
    @Productgroup   Int,
    @FirstWeek      Int,
    @LastWeek       Int
AS
    SET NOCOUNT ON

   --------------------------------------------------------
	---   Gets all the weeks within the financial year   ---
    --------------------------------------------------------
	;WITH FinancialWeeksCTE(week, StartDate, EndDate) AS
    (
        select
            [week], StartDate, EndDate
        from
            FinancialWeeks
        where
            finyear = @Year
    )
	SELECT
		week, 
		SUM(Received) AS Received, 
		SUM(Completed) AS Completed, 
		SUM(Outstanding) AS Outstanding, 
		SUM(AverageTAT) AS AverageTAT, 
		SUM(CompletedWithin7Days) AS CompletedWithin7Days, 
		SUM(CompletedWithin7Days) * 1.0 / ISNULL(NULLIF(SUM(Completed), 0), 1) * 100 AS SevenDayPercentage,
		SUM(JobsMore20Days) AS JobsMore20Days
	FROM 
	(
		--------------------------------------
		---   Gets the created SR's only   ---
		--------------------------------------
		SELECT 
			Weeks.week, COUNT(Creation.id) AS Received, NULL AS Completed, NULL AS Outstanding, NULL AS AverageTAT, NULL AS CompletedWithin7Days, NULL JobsMore20Days
		FROM 
			FinancialWeeksCTE Weeks
			LEFT JOIN 
			(
				SELECT 
					r.id, CONVERT(DATE, r.CreatedOn) AS CreatedOn
				FROM
					Service.Request r
					LEFT JOIN Stockinfo AS Si ON r.ItemId = Si.Id
					LEFT JOIN Code AS C ON C.Code = Si.Category AND ISNULL(C.Category,'') IN('PCE', 'PCO', 'PCF', 'PCW')
					LEFT JOIN Merchandising.Product pro ON Si.itemno = pro.SKU
					LEFT JOIN 
					(
						SELECT h.ProductId, h.HierarchyTagId
						FROM Merchandising.ProductHierarchy h 
						WHERE h.HierarchyLevelId = 1
					) Dep
						ON pro.id = Dep.ProductId
				WHERE
					ISNULL(Dep.HierarchyTagId, -1) = CASE WHEN @Productgroup IS NULL THEN ISNULL(Dep.HierarchyTagId, -1) ELSE @Productgroup END
			) Creation
				ON Creation.CreatedOn  BETWEEN weeks.StartDate AND Weeks.EndDate
				AND weeks.week BETWEEN @FirstWeek AND @LastWeek
		GROUP BY 
			Weeks.week
		UNION ALL
		--------------------------------
		---   Gets the SR's Solved   ---
		--------------------------------
		SELECT 
			Weeks.week, 
			NULL AS Received, 
			SUM(CASE 
					WHEN Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate THEN 1
					ELSE 0
				 END) AS Completed,
			SUM(CASE 
					WHEN Resolution.ResolutionDate > Weeks.EndDate AND Resolution.CreatedOn <= Weeks.EndDate THEN 1
					ELSE 0
				 END) AS Outstanding,
			SUM(CASE 
					WHEN Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate THEN CONVERT(DECIMAL(18, 6), DATEDIFF(DAY, Resolution.CreatedOn, Resolution.ResolutionDate))
					ELSE 0
				 END) 
			/
			ISNULL(NULLIF(SUM(CASE 
					WHEN Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate THEN 1
					ELSE 0
				 END), 0), 1) AS AverageTAT,
			SUM(CASE 
					WHEN Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate AND DATEDIFF(DAY, Resolution.CreatedOn, Resolution.ResolutionDate) < 8 THEN 1 
					ELSE 0 
				END) AS CompletedWithin7Days,
			SUM(CASE 
					WHEN Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate AND DATEDIFF(DAY, Resolution.CreatedOn, Resolution.ResolutionDate) > 20 THEN 1 
					ELSE 0 
				END) AS JobsMore20Days
		FROM 
			FinancialWeeksCTE Weeks
			LEFT JOIN 
			(
				SELECT 
					r.id, CONVERT(DATE, r.CreatedOn) AS CreatedOn, ISNULL(r.ResolutionDate, '20600101') AS ResolutionDate --- a very far ahead date in the future is set in case the SR has not been closed yet, just to make calculation easy
				FROM
					Service.Request r
					LEFT JOIN Stockinfo AS Si ON r.ItemId = Si.Id
					LEFT JOIN Code AS C ON C.Code = Si.Category AND ISNULL(C.Category,'') IN('PCE', 'PCO', 'PCF', 'PCW')
					LEFT JOIN Merchandising.Product pro ON Si.itemno = pro.SKU
					LEFT JOIN 
					(
						SELECT h.ProductId, h.HierarchyTagId
						FROM Merchandising.ProductHierarchy h 
						WHERE h.HierarchyLevelId = 1
					) Dep
						ON pro.id = Dep.ProductId
				WHERE
					ISNULL(Dep.HierarchyTagId, -1) = CASE WHEN @Productgroup IS NULL THEN ISNULL(Dep.HierarchyTagId, -1) ELSE @Productgroup END
			) Resolution
				ON 
				--- here are the Sr's that were solve in the future but were already created in the week
				(
					Resolution.ResolutionDate > Weeks.EndDate
					AND Resolution.CreatedOn <= Weeks.EndDate
				)
				--here are the sr's that were solved within that week
				OR
				(
					Resolution.ResolutionDate BETWEEN Weeks.StartDate AND Weeks.EndDate 
				)
		GROUP BY 
			Weeks.week
	) Data
	WHERE
		Week BETWEEN @FirstWeek AND @LastWeek  
	GROUP BY
		week
    ORDER BY 
		week
GO
