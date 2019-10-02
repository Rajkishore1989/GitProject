/*
User View for Service Request Batch Print

*/

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[SummaryPrintView]'))
DROP VIEW Service.SummaryPrintView
GO

CREATE VIEW Service.SummaryPrintView
AS
SELECT r.Id as RequestId,r.State as [Status],r.CreatedOn,DATEDIFF(d,r.CreatedOn,GETDATE()) as DaysOutstanding,r.LastUpdatedOn,
		'n/a' as CustomerChargeAcct,'No' as DepositPaid,'No' as ChargeAcctCancel

FROM service.Request r			

GO

-- End End End End End End End End End End End End End End End End End End End End End End End End End End End End End End 
