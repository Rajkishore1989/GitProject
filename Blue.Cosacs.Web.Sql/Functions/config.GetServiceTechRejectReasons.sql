IF OBJECT_ID('Config.GetServiceTechRejectReasons') IS NOT NULL
	DROP FUNCTION [Config].GetServiceTechRejectReasons
GO

CREATE FUNCTION [Config].GetServiceTechRejectReasons()
	returns @temptable TABLE (items varchar(max))   
AS   
BEGIN
	DECLARE @Delimiter	CHAR(5) = '<¬¬¬>'
	DECLARE @string		VARCHAR(4000)

	SELECT 
		@string = REPLACE(REPLACE((SELECT CONVERT(VARCHAR, ValueText) FROM [Config].[Setting] WHERE id = 'ServiceTechRejectReasons'), CHAR(13), ''), CHAR(10), @Delimiter)

   ;WITH Split(stpos,endpos) 
    AS(
        SELECT 
			0 AS stpos, CHARINDEX(@Delimiter, @String) AS endpos
        UNION ALL
        SELECT 
			endpos + len(@Delimiter), CHARINDEX(@Delimiter, @String, endpos + len(@Delimiter))
        FROM 
			Split
        WHERE 
			endpos > 0
    )
	INSERT INTO @temptable
    SELECT 
        SUBSTRING(@String, stpos, COALESCE(NULLIF(endpos, 0), LEN(@String) + 1) - stpos) AS Data
    FROM 
		Split
	WHERE
		ISNULL(endpos, 0) > 0

	RETURN
END
