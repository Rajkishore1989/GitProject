IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'LastDayOfCurrentMonth'
		   AND ss.name = 'dbo')
DROP FUNCTION  dbo.LastDayOfCurrentMonth
GO

CREATE function [dbo].[LastDayOfCurrentMonth](@today date)
RETURNS date
AS
BEGIN
	RETURN DATEADD (dd, -1, DATEADD(mm, DATEDIFF(mm, 0, @today) + 1, 0))
END