IF OBJECT_ID('Merchandising.UpdateProductStockLevel') IS NOT NULL
	DROP PROCEDURE Merchandising.UpdateProductStockLevel
GO 

CREATE PROCEDURE Merchandising.UpdateProductStockLevel		
@productStock Merchandising.UpdateProductStockLevelTVP READONLY 
AS

BEGIN
MERGE INTO Merchandising.productstocklevel AS Target
USING @productStock AS Source ON      Target.[LocationId] = Source.[LocationId] 
                                  AND Target.[ProductId] = Source.[ProductId] 
WHEN MATCHED THEN  
UPDATE SET StockOnHand = Source.StockOnHand + Target.StockOnHand,
   	       StockOnOrder = Source.StockOnOrder + Target.StockOnOrder,
		   StockAvailable = Source.StockAvailable + Target.StockAvailable
WHEN NOT MATCHED BY TARGET THEN  
INSERT (LocationId, ProductId, StockOnHand, StockOnOrder, StockAvailable)
VALUES (LocationId, ProductId, StockOnHand, StockOnOrder, StockAvailable);
END
