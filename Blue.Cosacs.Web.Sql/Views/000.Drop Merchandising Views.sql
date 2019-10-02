DECLARE @sql VARCHAR(MAX) = ''
        , @crlf VARCHAR(2) = CHAR(13) + CHAR(10) ;

SELECT @sql = @sql + 'DROP VIEW [Merchandising].[' + TABLE_NAME + ']' + @crlf
FROM   INFORMATION_SCHEMA.views where table_schema = 'Merchandising'

EXEC(@sql);