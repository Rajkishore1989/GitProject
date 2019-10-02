IF OBJECT_ID('Merchandising.CintOrderStatsGetQuantity') IS NOT NULL
	DROP PROCEDURE Merchandising.CintOrderStatsGetQuantity
GO 

CREATE PROCEDURE Merchandising.CintOrderStatsGetQuantity		
@stats Merchandising.CintOrderStatsTVP READONLY
AS

BEGIN

SELECT OrderId TempId, Quantity
FROM (
SELECT s.OrderId, c.QtyOrdered - c.QtyDelivered - c.QtyRepossessed - c.QtyReturned quantity, ROW_NUMBER() OVER( order by ID DESC) AS [Row]
FROM CintOrderStats c
INNER JOIN @stats s ON s.PrimaryReference = c.PrimaryReference 
                       AND s.ParentSku = c.ParentSku
					   AND s.Sku = c.Sku
					   AND s.StockLocation = c.StockLocation
WHERE (c.ReferenceType = 'Service Request' AND s.SecondaryReference = c.SecondaryReference )
    OR (c.ReferenceType = 'Invoice' AND s.SecondaryReference = c.SecondaryReference )
	OR c.ReferenceType = 'Delivery') AS BASE
WHERE [Row] = 1
END

