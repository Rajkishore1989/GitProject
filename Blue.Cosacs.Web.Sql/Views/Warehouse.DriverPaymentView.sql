

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[DriverPaymentView]'))
DROP VIEW [Warehouse].DriverPaymentView
GO

CREATE VIEW [Warehouse].[DriverPaymentView]
AS
	SELECT Payment.Id, Payment.ReceivingBranch, Receiving.branchname as ReceivingBranchName
		,Payment.SendingBranch, Sending.branchname as SendingBranchName
		,Payment.Size, Payment.Value
	FROM Warehouse.DriverPayment Payment
	INNER JOIN Branch Receiving ON Payment.ReceivingBranch = Receiving.branchno
	INNER JOIN Branch Sending ON Payment.SendingBranch = Sending.branchno
 
GO

