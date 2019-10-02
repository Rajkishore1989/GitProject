IF OBJECT_ID('Report.SpareParts') IS NOT NULL
	DROP PROCEDURE Report.SpareParts
GO 
CREATE PROCEDURE Report.SpareParts
	@DateFrom		Date,
	@DateTo			Date,
	@Branch			Int = NULL,
	@SparePartUsage	VarChar(32) = NULL,
	@PartSource		VarChar(32) = NULL,
	@PageIndex		int = 1,
	@PageSize       bigint = 250
AS
BEGIN

	SET NOCOUNT ON
	
	DECLARE @FirstRec int,
			@LastRec bigint

	IF ISNULL(@PageIndex, 0) < 1
		SET @PageIndex = 1

	IF ISNULL(@PageSize, 0) < 1
		SET @PageSize = 250

	SET @FirstRec = (@PageIndex - 1 ) * @PageSize
	SET @LastRec = ( @PageIndex * @PageSize + 1 )

	;WITH Results_CTE AS
		(SELECT
			ROW_NUMBER() OVER (ORDER BY CONVERT(datetime, SP.[DateDelivered], 103) Desc) AS RowNo,
			Count(1) over () AS TotalCount,
			SP.Source AS [Spare Part Usage], 
			CONVERT(VarChar, SP.[DateDelivered], 103) AS [Date Delivered], 
			CONVERT(VarChar, SP.[TransactionDate], 103) AS [Transaction Date], 
			SP.[AccountNumber] AS [Account Number], 
			SP.[ServiceRequestNumber] AS [Service Request Number], 
			SP.[PartProductCode] AS [Part Product Code], 
			SP.Quantity, 
			CAST(SP.[UnitPrice] AS DECIMAL(11,2)) as [Part Unit Price],
			CONVERT(DECIMAL(11, 2), SP.[CostPrice]) as [Part Cost Price],
			SP.Branch, 
			SP.[WarehouseBookingId] AS [Warehouse Booking Id], 
			SP.[PurchaseBranch] AS [Purchase Branch], 
			SP.[AgreementNumber] AS [Agreement Number], 
			SP.PartsSource AS [Parts Source]
		 FROM report.SparePartsView SP
		WHERE SP.[DateDelivered] BETWEEN @DateFrom AND @DateTo AND 
			(@Branch IS NULL OR ISNULL(Branch, 0) = @Branch) AND 
			(@SparePartUsage IS NULL OR SP.Source = @SparePartUsage) AND 
			(@PartSource IS NULL OR ISNULL(SP.[PartsSource], '') = @PartSource)
		)
	SELECT * 
	FROM Results_CTE
	WHERE RowNo > @FirstRec AND RowNo < @LastRec
	UNION
	SELECT 
		@LastRec AS RowNo,
		null,
		'Totals', 
		null, 
		null, 
		null, 
		null, 
		'', 
		SUM(ISNULL(Quantity, 0)), 
		NULL,
		SUM(CONVERT(DECIMAL(11, 2), ISNULL([Part Cost Price], 0))),		
		null, 
		null, 
		null, 
		null,
		NULL
	FROM 
		Results_CTE

END