IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[report].[MonthlyClaimsSummaryBySupplier]') AND type in (N'P', N'PC'))
DROP PROCEDURE [report].[MonthlyClaimsSummaryBySupplier]
GO

CREATE PROCEDURE [report].[MonthlyClaimsSummaryBySupplier]
	@FinYear CHAR(4), 
	@Month CHAR(2),	
	@Supplier VARCHAR(20)
AS
BEGIN
	SET NOCOUNT ON

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
	
	;WITH Month_CTE ([Supplier], [AmountClaimed])
	AS
	(
		SELECT CASE WHEN ISNULL(r.ResolutionSupplierToCharge,'') ='' THEN 'Other' ELSE r.ResolutionSupplierToCharge END AS Supplier, SUM(ct.Cost) AS AmountClaimed
		FROM Service.Request r 
			INNER JOIN Service.Charge ct ON r.Id = ct.RequestId
		WHERE r.ResolutionPrimaryCharge = 'Supplier' AND ct.Type = 'Supplier' AND r.IsClosed = 1 AND
			r.ResolutionDate BETWEEN @StartOfMonth AND @EndOfMonth
		GROUP BY r.ResolutionSupplierToCharge
	),
	Ytd_CTE ([Supplier], [YTD])
	AS
	(
		SELECT CASE WHEN ISNULL(r.ResolutionSupplierToCharge,'') ='' THEN 'Other' ELSE r.ResolutionSupplierToCharge END AS Supplier, SUM(ct.Cost) AS YTD
		FROM Service.Request r 
			INNER JOIN Service.Charge ct ON r.Id = ct.RequestId
		WHERE r.ResolutionPrimaryCharge='Supplier' AND ct.Type = 'Supplier' AND r.IsClosed = 1 AND
			r.ResolutionDate BETWEEN @StartofYear AND @EndOfYear
		GROUP BY r.ResolutionSupplierToCharge	
	)
	-- Return results
	SELECT DISTINCT s.Supplier, ISNULL(m.AmountClaimed, 0) AS [CurrentMonth], ISNULL(y.YTD, 0) AS [YearToDate]
	FROM ServiceSupplierView s LEFT OUTER JOIN Month_CTE m ON s.Supplier = m.supplier
		LEFT OUTER JOIN Ytd_CTE y ON s.Supplier = y.supplier
	WHERE (@Supplier = 'Any' OR s.Supplier = @Supplier)
	--ORDER BY s.Supplier
	UNION ALL
	SELECT DISTINCT 'Other' AS Supplier, ISNULL(m.AmountClaimed, 0) AS [CurrentMonth], ISNULL(y.YTD, 0) AS [YearToDate] 
	FROM ServiceSupplierView s LEFT OUTER JOIN Month_CTE m ON m.supplier = 'Other'
		LEFT OUTER JOIN Ytd_CTE y ON y.supplier = 'Other'
	WHERE (@Supplier = 'Any' OR @Supplier = 'Other')
	ORDER BY s.Supplier

END
GO


