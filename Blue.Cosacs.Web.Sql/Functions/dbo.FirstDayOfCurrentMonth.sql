IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'FirstDayOfCurrentMonth'
		   AND ss.name = 'dbo')
DROP FUNCTION  dbo.FirstDayOfCurrentMonth
GO

CREATE function [dbo].[FirstDayOfCurrentMonth](@today date)
RETURNS date
AS
BEGIN
	RETURN DATEADD(mm, DATEDIFF(mm, 0, @today), 0)
END