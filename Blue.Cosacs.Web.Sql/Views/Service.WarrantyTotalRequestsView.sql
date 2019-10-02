IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Service].[WarrantyTotalRequestsView]'))
DROP VIEW [Service].[WarrantyTotalRequestsView]

GO

CREATE VIEW [Service].[WarrantyTotalRequestsView] 
AS
	SELECT WS.Id AS WarrantyId, WS.ItemId, WS.CustomerAccount, WS.CustomerId, WS.ItemQuantity, WS.WarrantyType, 
		SR.State AS RequestState, Count(DISTINCT SR.Id) AS TotalRequests
	FROM Service.Request AS SR 
	INNER JOIN Warranty.WarrantySale AS WS 
		ON SR.WarrantyContractId = WS.Id AND SR.ItemId = WS.ItemId
	--WHERE WS.WarrantyType = 'F' AND SR.State <> 'Closed'
	GROUP BY WS.Id, WS.ItemId, WS.CustomerAccount, WS.CustomerId, WS.ItemQuantity, WS.WarrantyType, SR.State

GO