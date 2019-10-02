if object_id('[dbo].[FullMonthsDiff]') is not null
	DROP FUNCTION [dbo].[FullMonthsDiff]
GO

CREATE FUNCTION [dbo].[FullMonthsDiff]
(
    @DateA DATETIME,
    @DateB DATETIME
)
RETURNS INT
AS
BEGIN
    DECLARE @Result INT

    DECLARE @DateX DATETIME
    DECLARE @DateY DATETIME

    IF(@DateA < @DateB)
    BEGIN
    	SET @DateX = @DateA
    	SET @DateY = @DateB
    END
    ELSE
    BEGIN
    	SET @DateX = @DateB
    	SET @DateY = @DateA
    END

    SET @Result = (
    				SELECT
                    DATEDIFF(month, @DateX, @DateY)
                        - CASE
                            WHEN DAY(@DateY) < DAY(@DateX) THEN 1
                            ELSE 0
                          END
                          + 1
    				)

    RETURN @Result
END

GO

-- SELECT dbo.FullMonthsDiff('2009-04-16', '2009-05-15') as MonthSep -- =0
-- SELECT dbo.FullMonthsDiff('2009-04-16', '2009-05-16') as MonthSep -- =1
--SELECT dbo.FullMonthsDiff('2009-04-16', '2009-06-16') as MonthSep -- =2