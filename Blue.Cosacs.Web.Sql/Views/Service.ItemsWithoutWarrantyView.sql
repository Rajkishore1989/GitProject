IF EXISTS( SELECT *
             FROM sys.views
             WHERE object_id = OBJECT_ID( N'[Service].[ItemsWithoutWarrantyView]' ))BEGIN
        DROP VIEW Service.ItemsWithoutWarrantyView
END

GO

CREATE VIEW [Service].[ItemsWithoutWarrantyView]
AS

WITH ItemsWithNoWarranty AS 
	( 
		SELECT WS.ItemId, 
                WS.StockLocation, 
                WS.CustomerAccount, 
                WS.CustomerId, 
                WS.ItemQuantity
           FROM Warranty.WarrantySale AS WS
           WHERE ISNULL( WS.WarrantyContractNo, '' ) = '' OR 
                 WS.WarrantyContractNo = N'MAN001' 
	), 
	ItemsWithNoWarrantyReqCount AS 
	( 
		SELECT WS.ItemId, 
                WS.StockLocation, 
                WS.CustomerAccount, 
                WS.CustomerId, 
                COUNT(DISTINCT SR.Id )AS TotalRequests
           FROM
                Service.Request AS SR INNER JOIN ItemsWithNoWarranty AS WS
                ON SR.Account = WS.CustomerAccount AND 
                   SR.ItemStockLocation = WS.StockLocation AND 
                   SR.ItemId = WS.ItemId
           WHERE SR.State <> 'Closed'
           GROUP BY WS.ItemId, 
                    WS.CustomerAccount, 
                    WS.CustomerId, 
                    WS.StockLocation ), 
	ItemsWithNoWarrantyCount AS 
	( 
		SELECT WS.ItemId, 
                WS.StockLocation, 
                WS.CustomerAccount, 
                WS.CustomerId, 
				COUNT(WS.ItemId)AS ItemCount
        FROM ItemsWithNoWarranty AS WS
        GROUP BY WS.ItemId, 
                    WS.CustomerAccount, 
                    WS.CustomerId, 
                    WS.StockLocation
	)
    SELECT I.ItemId, 
           I.StockLocation, 
           I.CustomerAccount, 
           I.CustomerId, 
           ISNULL( RC.TotalRequests, 0 )AS TotalRequests, 
           I.ItemCount
      FROM
           ItemsWithNoWarrantyCount AS I 
		   LEFT OUTER JOIN ItemsWithNoWarrantyReqCount AS RC
			ON I.ItemId = RC.ItemId AND 
            I.CustomerAccount = RC.CustomerAccount AND 
              I.StockLocation = RC.StockLocation 
GO