IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Financial].TransactionView'))
DROP VIEW [Financial].[TransactionView]
GO

CREATE VIEW [Financial].[TransactionView]
AS

SELECT 
	t.Id, RunNo, Account, BranchNo, Type, Amount, Date, MessageId, Description,
	l.Id AS LocationId, 
	l.Name AS Location
FROM Financial.[Transaction] t
INNER JOIN Merchandising.Location l ON CONVERT(VARCHAR(4),t.BranchNo) = l.SalesId