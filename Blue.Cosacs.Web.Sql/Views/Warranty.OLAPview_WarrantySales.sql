IF OBJECT_ID('Warranty.OLAPview_WarrantySales') IS NOT NULL
	DROP VIEW Warranty.OLAPview_WarrantySales
GO

CREATE VIEW Warranty.OLAPview_WarrantySales
AS
	SELECT 
        ws.Id AS WarrantySaleId,
		w.Id AS WarrantyId,
		CASE -- exclude cancelled prices
			WHEN ws.[Status] = 'Cancelled' THEN 0
			ELSE ISNULL(ws.WarrantySalePrice,0)
		END AS Price,
		CASE
			WHEN ws.[Status] = 'Cancelled' THEN ISNULL(ws.WarrantySalePrice,0)
			ELSE 0
		END AS CancelledPrice,
		ws.WarrantyContractNo AS ContractNumber,
		ws.WarrantyLength AS Length,
		ws.WarrantyNumber AS Number,
		ws.SoldOn,
		ws.ItemId AS ProductId,
		ws.ItemNumber,
		ws.CustomerId,
		ws.CustomerAccount,
		CASE
			WHEN ws.[Status] = 'Cancelled' THEN 1
			ELSE 0
		END AS IsCancelledOrRepossessed
	FROM 
	    Warranty.Warrantysale ws
        INNER JOIN Warranty.Warranty w
            ON ws.WarrantyNumber = w.Number
        INNER JOIN StockInfo i
            ON ws.ItemNumber = i.itemno
        INNER JOIN customer c
            ON ws.CustomerId = c.custid
    WHERE
        i.category IS NOT NULL
        AND i.category NOT IN (
            0, -- exclude lost items (wincosacs old hacked items)
            12, 82
        )

