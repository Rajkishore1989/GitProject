IF OBJECT_ID('Merchandising.UpdateCintOrderStats') IS NOT NULL
	DROP PROCEDURE Merchandising.UpdateCintOrderStats
GO 

CREATE PROCEDURE Merchandising.UpdateCintOrderStats		
@stats Merchandising.UpdateCintOrderStatsTVP READONLY
AS

BEGIN

-- System checks that there is a existing order before delivery or is sent in the same batch.
-- We can't have delivery without an order so order will never be null. Update order line should not reset deliveries to 0. 

MERGE INTO Merchandising.CintOrderStats AS Target
USING @stats AS Source ON   Target.PrimaryReference = Source.PrimaryReference AND
							Target.SecondaryReference = Source.SecondaryReference AND
							Target.ReferenceType = Source.ReferenceType AND
							Target.ParentSku = Source.ParentSku AND
							Target.Sku = Source.Sku AND
							Target.StockLocation = Source.StockLocation
WHEN MATCHED THEN  
UPDATE SET QtyOrdered = CASE WHEN Source.QtyOrdered = 0 -- No new orders.
                             THEN CASE WHEN Source.QtyOrderedInc + Target.QtyOrdered < 0 THEN 0 ELSE Source.QtyOrderedInc + Target.QtyOrdered END -- Update old order with cancellation.      (Cancellation)
							 ELSE CASE WHEN Source.QtyOrderedInc + Source.QtyOrdered < 0 THEN 0 ELSE Source.QtyOrderedInc + Source.QtyOrdered END -- Set to latest order minus cancellations. (Order + Cancellation)
							 END,
   	       QtyDelivered = Source.QtyDeliveredInc + Target.QtyDelivered,
		   QtyReturned = Source.QtyReturnedInc + Target.QtyReturned ,
		   QtyRepossessed = Source.QtyRepossessedInc + Target.QtyRepossessed
								
WHEN NOT MATCHED BY TARGET THEN  
INSERT (PrimaryReference, Sku, ParentSku, StockLocation, QtyOrdered, QtyDelivered, QtyReturned, QtyRepossessed, SecondaryReference, ReferenceType) 
VALUES (PrimaryReference, Sku, ParentSku, StockLocation, QtyOrdered + Source.QtyOrderedInc, QtyDeliveredInc, QtyReturnedInc, QtyRepossessedInc, SecondaryReference, ReferenceType);

END