IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PeriodEndDatesView]'))
DROP VIEW  [Merchandising].[PeriodEndDatesView]
GO

create view [Merchandising].[PeriodEndDatesView] as
Select max(id) as Id, [year], period, max(enddate) as EndDate
from merchandising.PeriodData
group by [year], period
