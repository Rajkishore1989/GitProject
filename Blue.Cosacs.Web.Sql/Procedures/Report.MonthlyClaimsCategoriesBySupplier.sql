IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[report].[MonthlyClaimsCategoriesBySupplier]') AND type in (N'P', N'PC'))
DROP PROCEDURE [report].[MonthlyClaimsCategoriesBySupplier]
GO

CREATE PROCEDURE [report].[MonthlyClaimsCategoriesBySupplier]
	@FinYear CHAR(4), 
	@Month CHAR(2),	
	@Supplier VARCHAR(200)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @StartOfYear DATETIME,@EndOfYear DATETIME,
			@StartOfMonth DATETIME,@EndOfMonth datetime

	SET @StartOfYear = @FinYear + '-04-01'
	SET @EndOfYear = DATEADD(dd, -1, DATEADD(yy, 1, @StartOfYear))
	SET @StartOfMonth = @FinYear + '-' + @month + '-01'
	-- SET month date to next year if before April
	IF @month < 04 SET @StartOfMonth = DATEADD(yy, 1, @StartOfMonth)

	SET @EndOfMonth = DATEADD(dd, -1, DATEADD(mm, 1, @StartOfMonth))
	SET @EndOfMonth = DATEADD(mi, -1, (DATEADD(d, 1, @EndOfMonth)))		-- Set date to end of day i.e 23:59
	SET @EndOfYear = @EndOfMonth		--UAT199 year to date up to month selected

	;WITH Cat_Month_CTE ([Category], [Supplier], [Parts], [Labour])
	AS (
		SELECT Co.codedescript AS Category, CASE WHEN ISNULL(R.ResolutionSupplierToCharge,'') = '' THEN 'Other' ELSE r.ResolutionSupplierToCharge END AS Supplier,
			SUM(CASE WHEN C.Label LIKE 'Parts%' THEN C.Cost ELSE 0 END) AS [Parts],
			SUM(CASE WHEN (C.Label LIKE 'Labour%' OR C.Label LIKE 'Additional%') THEN C.Cost ELSE 0 END) AS [Labour]
		FROM Service.Request R
		INNER JOIN Service.Charge C
			ON R.Id = C.RequestId
		INNER JOIN code Co 
			ON Co.code = CAST(R.ProductLevel_2 AS varchar) AND Co.category = R.ProductLevel_1
		WHERE C.Type = 'Supplier' AND R.ResolutionPrimaryCharge = 'Supplier' AND R.IsClosed = 1 AND
			R.ResolutionDate BETWEEN @StartOfMonth AND @EndOfMonth AND R.ResolutionSupplierToCharge = @Supplier
		GROUP BY R.ResolutionSupplierToCharge, Co.codedescript
	),
	Cat_Ytd_CTE ([Category], [Supplier], [PartsYtd], [LabourYtd])
	AS (
		SELECT Co.codedescript AS Category, CASE WHEN ISNULL(R.ResolutionSupplierToCharge,'') = '' THEN 'Other' ELSE r.ResolutionSupplierToCharge END AS Supplier,
			SUM(CASE WHEN C.Label LIKE 'Parts%' THEN C.Cost ELSE 0 END) AS [Parts],
			SUM(CASE WHEN (C.Label LIKE 'Labour%' OR C.Label LIKE 'Additional%') THEN C.Cost ELSE 0 END) AS [Labour]
		FROM Service.Request R
		INNER JOIN Service.Charge C
			ON R.Id = C.RequestId
		INNER JOIN code Co 
			ON Co.code = CAST(R.ProductLevel_2 AS varchar) AND Co.category = R.ProductLevel_1
		WHERE C.Type = 'Supplier' AND R.ResolutionPrimaryCharge = 'Supplier' AND R.IsClosed = 1 AND
			R.ResolutionDate BETWEEN @StartofYear AND @EndOfYear AND R.ResolutionSupplierToCharge = @Supplier
		GROUP BY R.ResolutionSupplierToCharge, Co.codedescript
	)

	SELECT DISTINCT m.[Category], ISNULL(m.[Parts], 0) AS [Parts], ISNULL(m.[Labour], 0) AS [Labour], 
		ISNULL(y.[PartsYtd], 0) AS [PartsYtd], ISNULL(y.[LabourYtd], 0) AS [LabourYtd]
	FROM (SELECT codedescript FROM code WHERE category IN ('PCE', 'PCO', 'PCF', 'PCW') AND statusflag = 'L') C 
	LEFT OUTER JOIN Cat_Month_CTE m ON C.codedescript = m.Category
		LEFT OUTER JOIN Cat_Ytd_CTE y ON C.codedescript = y.Category
	WHERE ISNULL(m.[Category], '') <> ''
	
END

GO


