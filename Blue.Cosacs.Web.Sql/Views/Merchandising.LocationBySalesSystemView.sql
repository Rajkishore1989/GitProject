if  exists (select * from sys.views where object_id = object_id(N'[Merchandising].[LocationBySalesSystemView]'))
drop view  [Merchandising].[LocationBySalesSystemView]
go

create view [Merchandising].[LocationBySalesSystemView] as
select
    l.Id,
	l.SalesId [Warehouse]
from	
	Merchandising.Location l