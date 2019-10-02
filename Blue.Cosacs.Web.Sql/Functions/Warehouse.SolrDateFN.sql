IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'SolrDateFN'
		   AND ss.name = 'Warehouse')
DROP FUNCTION  Warehouse.SolrDateFN
GO

CREATE FUNCTION Warehouse.SolrDateFN (  @DateIn DateTime)
RETURNS VARCHAR(24)
AS
BEGIN
	RETURN  (CONVERT(VARCHAR(23),@DateIn,126) + 'Z' )
END



