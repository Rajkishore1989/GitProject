IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Report].[Resolution]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [Report].[Resolution]
GO

CREATE PROCEDURE [Report].[Resolution]
    @Year           SMALLINT,
    @FromWeekNo     TINYINT,
    @ToWeekNo       TINYINT,
    @Resolution     VARCHAR(100) = NULL,
    @Category       Int = NULL,
    @MaxRecords     INT = NULL
AS
    SET NOCOUNT ON;

    DECLARE @DateFrom DATE
    DECLARE @DateTo DATE
    DECLARE @FirstYear SMALLINT
    DECLARE @SecondYear SMALLINT

    SET @FirstYear = @Year

    IF @FromWeekNo > 39  -- Week no fall within the forth Quater
        SET @FirstYear = @Year + 1

    SELECT  @DateFrom = StartDate
    FROM    FinancialWeeks
    WHERE
        [YEAR] = @FirstYear
        AND [Week] = @FromWeekNo

    SET @SecondYear = @Year

    IF @ToWeekNo > 39      -- Week no fall within the forth Quater
        SET @SecondYear = @Year + 1

    SELECT  @DateTo = EndDate
    FROM    FinancialWeeks
    WHERE
        [YEAR] = @SecondYear
        AND [Week] = @ToWeekNo

    IF @MaxRecords IS NULL
		SET @MaxRecords = 999999999
                
    SELECT TOP (@MaxRecords)
        @Year AS [Year],
        dbo.GetWeekNo(Rq.ResolutionDate) AS [Week No.],
        Rq.Id AS [Service Request No.],
        PH.Name AS [Product Category],
        P.IUPC AS [Product Code],
        P.itemdescr1 AS [Product Description],
        Rq.Resolution
    FROM
        Service.Request AS Rq
    INNER JOIN StockInfo AS P
        ON Rq.ItemId = P.Id
    LEFT OUTER JOIN (
		SELECT t.Id, t.Name
		FROM  Merchandising.HierarchyTag t
		WHERE t.LevelId = 2
    ) AS PH
        ON ph.Id = Rq.ProductLevel_2 
    WHERE
        Rq.ResolutionDate IS NOT NULL
        AND Rq.ResolutionDate >= @DateFrom
        AND Rq.ResolutionDate <= @DateTo
		AND ISNULL(Rq.Resolution, '') = CASE 
											WHEN @Resolution IS NULL THEN ISNULL(Rq.Resolution, '')
											ELSE @Resolution 
										END 
        AND ISNULL(Rq.ProductLevel_2, -1) = CASE 
												WHEN @Category IS NULL THEN ISNULL(Rq.ProductLevel_2, -1)
												ELSE @Category 
											END
    ORDER BY [Week No.]
GO


