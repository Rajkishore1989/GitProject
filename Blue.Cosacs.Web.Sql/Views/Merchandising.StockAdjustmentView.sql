IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockAdjustmentView]'))
DROP VIEW  [Merchandising].[StockAdjustmentView]
GO

create view [Merchandising].[StockAdjustmentView] as
SELECT
   sa.Id
  ,sa.LocationId
  ,l.Name [Location]
  ,l.SalesId [SalesLocationId]
  ,sa.ReferenceNumber
  ,sa.PrimaryReasonId
  ,pr.Name [PrimaryReason]
  ,sa.SecondaryReasonId
  ,sr.SecondaryReason
  ,sa.Comments
  ,sa.AuthorisedDate
  ,sa.AuthorisedById
  ,a.FullName [AuthorisedBy]
  ,sa.CreatedDate
  ,sa.CreatedById
  ,c.FullName [CreatedBy]
  ,OriginalPrint
FROM
	[Merchandising].StockAdjustment sa
	join
	[Merchandising].Location l on sa.LocationId = l.Id
	join
	[Merchandising].StockAdjustmentPrimaryReason pr on sa.PrimaryReasonId = pr.Id
	join
	[Merchandising].StockAdjustmentSecondaryReason sr on sr.PrimaryReasonId = pr.Id and sa.SecondaryReasonId = sr.Id
	left join
	[Admin].[User] c on sa.CreatedById = c.Id
	left join
	[Admin].[User] a on sa.AuthorisedById = a.Id