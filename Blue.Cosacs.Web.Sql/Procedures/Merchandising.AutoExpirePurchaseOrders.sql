IF OBJECT_ID('Merchandising.AutoExpirePurchaseOrders') IS NOT NULL
	DROP PROCEDURE Merchandising.AutoExpirePurchaseOrders
GO 

CREATE PROCEDURE Merchandising.AutoExpirePurchaseOrders		
@ExpireDate DateTime
AS
BEGIN
	DECLARE @ids table (id int); 

	UPDATE p
	SET P.Status = 'Expired',
		P.ExpiredDate = GETDATE()
	OUTPUT INSERTED.Id INTO @ids
	FROM Merchandising.PurchaseOrder p
	WHERE p.Status IN ('New','PartiallyReceived')
	AND NOT EXISTS (SELECT 1
					FROM Merchandising.PurchaseOrderProduct pop  
					WHERE pop.EstimatedDeliveryDate >= @ExpireDate 
					AND p.Id = pop.PurchaseOrderId)
	AND EXISTS (SELECT 1
					FROM Merchandising.PurchaseOrderProduct pop  
					WHERE p.Id = pop.PurchaseOrderId)
	SELECT id
	FROM @ids
END


