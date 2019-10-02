IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'OLAPview_ProductGroup'
		   AND ss.name = 'Service')
DROP VIEW  Service.OLAPview_ProductGroup
GO

CREATE VIEW Service.OLAPview_ProductGroup
AS

select cc.category as ProductGroup,cc.catdescript as ProductGroupName
from codecat cc 
where category like 'PC%'

Go
