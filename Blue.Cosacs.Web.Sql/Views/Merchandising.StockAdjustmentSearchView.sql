IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockAdjustmentSearchView]'))
DROP VIEW  [Merchandising].[StockAdjustmentSearchView]
GO

CREATE VIEW [Merchandising].[StockAdjustmentSearchView] 
AS

SELECT a.Id, a.Id as StockAdjustmentId, a.PrimaryReasonId,  pr.Name as PrimaryReason
, a.LocationId, l.Name as Location, a.SecondaryReasonId, sr.SecondaryReason, a.CreatedDate, a.ReferenceNumber
,CASE WHEN a.AuthorisedDate IS NULL THEN 0 ELSE 1 END AS Approved
,CASE WHEN a.AuthorisedDate IS NULL THEN 'Pending Approval' ELSE 'Approved' END AS [Status]
, sum(p.Quantity * p.AverageWeightedCost) as TotalCost
, a.Comments 
FROM merchandising.StockAdjustment a
INNER JOIN merchandising.StockAdjustmentPrimaryReason pr on a.PrimaryReasonId = pr.Id
INNER JOIN merchandising.StockAdjustmentSecondaryReason sr on a.SecondaryReasonId = sr.Id
INNER JOIN merchandising.StockAdjustmentProduct p on p.StockAdjustmentId = a.Id
INNER JOIN Merchandising.Location l on l.id = a.LocationId

GROUP BY a.Id, a.Id, a.PrimaryReasonId,  pr.Name 
, a.LocationId, l.name, a.SecondaryReasonId, sr.SecondaryReason, a.CreatedDate, a.ReferenceNumber
,CASE WHEN a.AuthorisedDate IS NULL THEN 0 ELSE 1 END
,CASE WHEN a.AuthorisedDate IS NULL THEN 'Pending Approval' ELSE 'Approved' END
, a.Comments 


GO



