IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[HistoryView]'))
DROP VIEW  service.HistoryView
Go

CREATE VIEW Service.HistoryView
AS
SELECT r.Id as RequestId,
        r2.Id ,
        r2.CreatedOn ,
        r2.State ,
        r2.LastUpdatedOn
FROM Service.Request r
CROSS JOIN Service.Request r2 
WHERE r.Id != r2.Id 
AND r.ItemNumber = r2.ItemNumber 
AND r.ItemSupplier = r2.ItemSupplier
AND (r.ItemSerialNumber = r2.ItemSerialNumber AND r.ItemSerialNumber IS NOT NULL
	  OR   r.Account = r2.Account 
	)