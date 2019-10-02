if object_id('[dbo].[GetWeekNo]') is not null
	DROP FUNCTION [dbo].[GetWeekNo]
GO

CREATE FUNCTION [dbo].[GetWeekNo] 
(
	@Date date
)
RETURNS tinyint
AS
BEGIN
	DECLARE @Week tinyint

	SELECT @Week = [Week]
	FROM FinancialWeeks
	WHERE StartDate <= @Date AND EndDate >= @Date

	RETURN @Week

END
GO

