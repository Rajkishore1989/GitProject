IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'LastDayOfPreviousMonth'
		   AND ss.name = 'dbo')
DROP FUNCTION  dbo.LastDayOfPreviousMonth
GO

CREATE function [dbo].[LastDayOfPreviousMonth](@today date)
RETURNS date
AS
BEGIN
	RETURN DATEADD(DAY, -(DAY(@today)), @today)
END