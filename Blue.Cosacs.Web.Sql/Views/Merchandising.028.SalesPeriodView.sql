IF EXISTS (SELECT * FROM sys.views WHERE name = 'SalesPeriodView')
DROP VIEW [Merchandising].[SalesPeriodView]
GO

CREATE VIEW [Merchandising].[SalesPeriodView]
AS


select 1 as ID, 'This Period' as Period, DATEADD(mm, DATEDIFF(mm, 0, GETDATE()), 0) as StartDate, getdate() as EndDate union
select 2 as ID, 'Last Period' as Period, DATEADD(mm, DATEDIFF(mm, 0, GETDATE()) - 1, 0) as StateDate, DATEADD(DAY, -(DAY(GETDATE())), GETDATE()) as EndDate union
select 3 as ID, 'This YTD' as Period, DATEADD(yy, DATEDIFF(yy,0,getdate()), 0), getdate() as EndDate union
select 4 as ID, 'Last YTD' as Period, DATEADD(yy, DATEDIFF(yy,0,getdate())-1, 0), dateadd(yy, -1, getdate()) as EndDate

