IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockAdjustmentReasonView]'))
DROP VIEW  [Merchandising].[StockAdjustmentReasonView]
GO

create view [Merchandising].[StockAdjustmentReasonView] as
SELECT
   ROW_NUMBER() OVER( ORDER BY sr.Id ) Id,
   pr.Name AS PrimaryReason,
   pr.DateDeleted AS PrimaryReasonDateDeleted,   
   sr.Id SecondaryReasonId,
   pr.Id PrimaryReasonId,
   sr.SecondaryReason,
   sr.TransactionCode,
   sr.DebitAccount,
   sr.CreditAccount,
   sr.SplitDebitByDepartment,
   sr.SplitCreditByDepartment,
   sr.DefaultForCountAdjustment
FROM	
	[Merchandising].StockAdjustmentPrimaryReason pr
	left join
	[Merchandising].StockAdjustmentSecondaryReason sr on sr.PrimaryReasonId = pr.Id
WHERE 
	(sr.DateDeleted IS NULL)
	and
	(pr.DateDeleted IS NULL)