IF OBJECT_ID('Merchandising.CreateNewProductStockLevels') IS NOT NULL
	DROP PROCEDURE Merchandising.CreateNewProductStockLevels
GO 

CREATE PROCEDURE Merchandising.CreateNewProductStockLevels		
AS
BEGIN
	INSERT INTO Merchandising.ProductStockLevel
	(LocationId, ProductId, StockOnHand, StockOnOrder, StockAvailable)
	SELECT DISTINCT l.Id, p.Id, 0,0,0
	FROM Merchandising.Product p
	CROSS JOIN Merchandising.Location l
	WHERE NOT EXISTS (SELECT 1 
					  FROM Merchandising.ProductStockLevel ps
					  WHERE ps.ProductId = p.Id 
					  AND ps.LocationId = l.Id)
END