IF OBJECT_ID('Report.ResolutionTimesProductCategory') IS NOT NULL
	DROP PROCEDURE Report.ResolutionTimesProductCategory
GO

CREATE PROCEDURE Report.ResolutionTimesProductCategory 
	@ResolveOrComplete		Bit,/*1 = Resolve; 0 = Complete*/
	@DateLoggedFrom			Date = NULL,
	@DateLoggedTo			Date = NULL,
	@DateAllocatedFrom		Date = NULL,
	@DateAllocatedTo		Date = NULL,
	@TechnicianId			Int = NULL,
	@ProductCategory		SmallInt = NULL,
	@ChargeTo				VarChar(64) = NULL
AS 

	SET NOCOUNT ON 

	;WITH Data([Product Category], [Days (0 - 3)],  [Days (4 - 7)], [Days (8 - 14)],  [Days (15+)]) AS 
	(
		SELECT --DISTINCT
			h.Name as [Product Category],
			CASE  
				WHEN @ResolveOrComplete = 1 THEN
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, r.CreatedOn), r.ResolutionDate) BETWEEN 0 AND 3 THEN 1.0 ELSE 0.0 END)
				ELSE
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, t.AllocatedOn), r.ResolutionDate) BETWEEN 0 AND 3 THEN 1.0 ELSE 0.0 END)
			END AS [Days (0 - 3)],
			CASE
				WHEN @ResolveOrComplete = 1 THEN  
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, r.CreatedOn), r.ResolutionDate) BETWEEN 4 AND 7 THEN 1.0 ELSE 0.0 END)
				ELSE
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, t.AllocatedOn), r.ResolutionDate) BETWEEN 4 AND 7 THEN 1.0 ELSE 0.0 END)		
			END AS [Days (4 - 7)],
			CASE  
				WHEN @ResolveOrComplete = 1 THEN
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, r.CreatedOn), r.ResolutionDate) BETWEEN 8 AND 14 THEN 1.0 ELSE 0.0 END)
				ELSE
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, t.AllocatedOn), r.ResolutionDate) BETWEEN 8 AND 14 THEN 1.0 ELSE 0.0 END)
			END AS [Days (8 - 14)],
			CASE
				WHEN @ResolveOrComplete = 1 THEN
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, r.CreatedOn), r.ResolutionDate) > 14 THEN 1.0 ELSE 0.0 END)
				ELSE
					CONVERT(DECIMAL(5, 2), CASE WHEN DATEDIFF(DAY, CONVERT(DATE, t.AllocatedOn), r.ResolutionDate) > 14 THEN 1.0 ELSE 0.0 END)
			END AS [Days (15+)]
		FROM 
			Service.Request r
			INNER JOIN Service.TechnicianBooking t
				ON r.id = t.RequestId
			LEFT JOIN Merchandising.HierarchyTag h
				ON h.Id = r.ProductLevel_2
			LEFT JOIN 
			(
				SELECT RequestId, Type FROM Service.Charge GROUP BY RequestId, Type
			) sc
				ON r.id = sc.RequestId
		WHERE 
			r.CreatedOn >= CASE
								WHEN @DateLoggedFrom IS NULL THEN r.CreatedOn
								ELSE @DateLoggedFrom
						   END 
			AND r.CreatedOn <= CASE
									WHEN @DateLoggedTo IS NULL THEN r.CreatedOn
									ELSE @DateLoggedTo
							   END 
			AND ISNULL(r.ResolutionDate, '19000101') >= CASE
															WHEN @DateAllocatedFrom IS NULL THEN ISNULL(r.ResolutionDate, '19000101')
															ELSE @DateAllocatedFrom
														END 
			AND ISNULL(r.ResolutionDate, '19000101') <= CASE
															WHEN @DateAllocatedTo IS NULL THEN ISNULL(r.ResolutionDate, '19000101')
															ELSE @DateAllocatedTo
														END 
			AND ISNULL(sc.Type, '') = CASE 
										WHEN @ChargeTo IS NULL THEN ISNULL(sc.Type, '')
										ELSE @ChargeTo 
									  END
			AND t.UserId = CASE 
								WHEN @TechnicianId IS NULL THEN t.UserId
								ELSE @TechnicianId
						   END
			AND ISNULL(r.ProductLevel_2, 0) = CASE 
										WHEN @ProductCategory IS NULL THEN ISNULL(r.ProductLevel_2, 0)
										ELSE @ProductCategory 
								   END
	)
	SELECT 
		d.[Product Category],
		SUM(d.[Days (0 - 3)]) AS [Days (0 - 3)],
		CONVERT(DECIMAL(5, 2), SUM(d.[Days (0 - 3)]) / ISNULL(NULLIF(SUM(d.[Days (0 - 3)] + d.[Days (15+)] + d.[Days (4 - 7)] + d.[Days (8 - 14)]), 0), 1) * 100) AS [Days (0 - 3)%],
		SUM(d.[Days (4 - 7)]) AS [Days (4 - 7)],
		CONVERT(DECIMAL(5, 2), SUM(d.[Days (4 - 7)]) / ISNULL(NULLIF(SUM(d.[Days (0 - 3)] + d.[Days (15+)] + d.[Days (4 - 7)] + d.[Days (8 - 14)]), 0), 1) * 100) AS [Days (4 - 7)%],
		SUM(d.[Days (8 - 14)]) AS [Days (8 - 14)],
		CONVERT(DECIMAL(5, 2), SUM(d.[Days (8 - 14)]) / ISNULL(NULLIF(SUM(d.[Days (0 - 3)] + d.[Days (15+)] + d.[Days (4 - 7)] + d.[Days (8 - 14)]), 0), 1) * 100) AS [Days (8 - 14)%],
		SUM(d.[Days (15+)]) AS [Days (15+)],
		CONVERT(DECIMAL(5, 2), SUM(d.[Days (15+)]) / ISNULL(NULLIF(SUM(d.[Days (0 - 3)] + d.[Days (15+)] + d.[Days (4 - 7)] + d.[Days (8 - 14)]), 0), 1) * 100) AS [Days (15+)%],
		SUM(d.[Days (0 - 3)] + d.[Days (15+)] + d.[Days (4 - 7)] + d.[Days (8 - 14)]) AS Total
	FROM 
		Data d
	GROUP BY 
		d.[Product Category]
	ORDER BY 
		d.[Product Category]
	
