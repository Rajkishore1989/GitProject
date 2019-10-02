IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockCountView]'))
DROP VIEW  Merchandising.StockCountView
GO

create view Merchandising.StockCountView as
select
	 sc.Id
	,sc.LocationId
	,l.Name [Location]
	,sc.[Type]
	,sc.CountDate
	,sc.CreatedById
	,crtu.FullName [CreatedBy]
	,sc.CreatedDate
	,sc.CancelledById
	,sc.StockAdjustmentId
	,canu.FullName [CancelledBy]
	,sc.CancelledDate
	,sbu.FullName [StartedBy]
	,sc.StartedById
	,sc.StartedDate
	,sc.ClosedDate
	,sc.ClosedById
	,clbu.FullName [ClosedBy]
	,case 
		when CancelledDate is not null
		then 'Cancelled'
		
		when ClosedDate is not null
		then 'Closed'
		
		when sc.StartedDate is not null
		then 'In Progress'
		
		else 'Pending'
		end as [Status]
from
	Merchandising.StockCount sc
	join
	Merchandising.Location l on sc.LocationId = l.Id
	join
	[Admin].[User] crtu on sc.CreatedById = crtu.Id
	left join
	[Admin].[User] canu on sc.CancelledById = canu.Id
	left join
	[Admin].[User] sbu on sc.StartedById = sbu.Id
	left join
	[Admin].[User] clbu on sc.ClosedById = clbu.Id