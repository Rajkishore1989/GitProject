IF OBJECT_ID('Merchandising.CintOrderSave') IS NOT NULL
	DROP PROCEDURE Merchandising.CintOrderSave
GO 

CREATE PROCEDURE Merchandising.CintOrderSave		
@cintOrder Merchandising.CintOrderTVP READONLY
AS

BEGIN

DECLARE @Ids TABLE
(
	Id INT,
	TempId INT
)

MERGE Merchandising.CintOrder AS Target  
     USING @cintOrder AS Source ON 1 = 0
    WHEN NOT MATCHED THEN
		INSERT (RunNo, [Type], PrimaryReference, SaleType, SaleLocation, Sku, ProductId, StockLocation, ParentSku, ParentId, TransactionDate, Quantity, Price, Tax, SecondaryReference, ReferenceType, Discount, CashPrice, PromotionId, CostPrice) 
		VALUES (RunNo, [Type], PrimaryReference, SaleType, SaleLocation, Sku, ProductId, StockLocation, ParentSku, ParentId, TransactionDate, Quantity, Price, Tax, SecondaryReference, ReferenceType, Discount, CashPrice, PromotionId, CostPrice)
    OUTPUT Inserted.Id, Source.TempId INTO @Ids;

	;WITH Orders AS
	(
		select c2.PrimaryReference, c2.ParentSku, c2.Sku, c2.StockLocation, ROW_NUMBER() OVER(ORDER BY c2.PrimaryReference ASC) AS SetRow
		FROM Merchandising.CintOrder c
		INNER JOIN @Ids ids on ids.Id = c.id
		INNER JOIN Merchandising.CintOrder c2 on c2.PrimaryReference = c.PrimaryReference
		WHERE c2.Sku = c.Sku
		AND c2.ParentSku = c.ParentSku
		AND c2.StockLocation = c.StockLocation
		GROUP BY c2.PrimaryReference, c2.ParentSku, c2.Sku, c2.StockLocation
		
	)
	UPDATE o
	SET CintRegularOrderId = regOrders.Id
	FROM Merchandising.CintOrder o
	INNER JOIN Orders o2 ON o2.PrimaryReference = o.PrimaryReference 
	                        AND o2.ParentSku = o.[ParentSku] 
							AND o2.Sku = o.Sku 
							AND o2.StockLocation = o.StockLocation
	LEFT JOIN (SELECT co.Id, o4.[SetRow], ROW_NUMBER() OVER ( PARTITION BY o4.[SetRow] ORDER BY co.TransactionDate desc) [Row]
	           FROM Merchandising.CintOrder co
			   INNER JOIN Orders o4  ON co.PrimaryReference = o4.PrimaryReference 
									AND co.ParentSku = o4.[ParentSku] 
									AND co.Sku = o4.Sku 
									AND co.StockLocation = o4.StockLocation
				WHERE co.Type = 'RegularOrder') AS RegOrders ON RegOrders.SetRow = o2.SetRow AND RegOrders.Row = 1

	SELECT TempId, Id
	FROM @Ids
END