IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[AllocatedStockView]'))
DROP VIEW  [Merchandising].[AllocatedStockView]
GO

CREATE VIEW Merchandising.AllocatedStockView 
AS   

WITH LastestCintOrder
AS
(
  SELECT  PrimaryReference,sku, Parentsku, ReferenceType, StockLocation, TransactionDate,
          ROW_NUMBER() OVER (PARTITION BY PrimaryReference, sku, Parentsku, ReferenceType, StockLocation ORDER BY TransactionDate DESC) as RowId
  FROM Merchandising.CintOrder  
), 
CintStats
AS
(
	SELECT  PrimaryReference,sku, Parentsku, ReferenceType, StockLocation, sum(QtyOrdered) ordered, sum(QtyDelivered) delivered,  
               (SELECT DISTINCT SecondaryReference + ' '
			   FROM Merchandising.CintOrderStats s2 
               WHERE s2.PrimaryReference = s.PrimaryReference
			   AND s2.sku = s.sku
			   AND s2.Parentsku = s.Parentsku
			   AND s2.ReferenceType = s.ReferenceType
			   AND s2.StockLocation = s.StockLocation
			    FOR XML PATH, TYPE).value('.[1]', 'nvarchar(max)') AS SecondaryReference
    FROM Merchandising.CintOrderStats s
	GROUP BY PrimaryReference,sku, Parentsku, ReferenceType, StockLocation
	HAVING  sum(QtyOrdered) > sum(QtyDelivered)
),
CostPrice
AS
(
	SELECT productid, AverageWeightedCost,   ROW_NUMBER() OVER (PARTITION BY productid ORDER BY AverageWeightedCostUpdated DESC)  as RowId
    FROM Merchandising.costprice  
)  
SELECT CAST(ROW_NUMBER() OVER (ORDER BY co.SKU DESC) AS INT) Id,  
 l.id LocationId,  
 l.Name AS LocationName,  
 Fascia,  
 p.Sku,  
 p.Id as ProductId,  
 p.LongDescription,  
 psl.StockOnHand,  
 psl.StockOnHand * cp.AverageWeightedCost AS StockOnHandValue,  
 psl.StockAvailable,  
 psl.StockAvailable * cp.AverageWeightedCost AS StockAvailableValue,  
 (cs.ordered - cs.delivered) AS StockAllocated,  
 (cs.ordered - cs.delivered) * cp.AverageWeightedCost AS StockAllocatedValue,  
 co.PrimaryReference + ' - ' + co.ReferenceType + ':' + cs.SecondaryReference  AS Reference,  
 co.TransactionDate as DateAllocated,
 l.Warehouse as LocationIsWarehouse  
FROM LastestCintOrder co  
INNER JOIN CintStats cs ON cs.PrimaryReference = co.PrimaryReference  
						 AND cs.Sku = co.Sku  
						 AND cs.ParentSku = co.ParentSku  
						 AND cs.ReferenceType = co.referencetype  
						 AND cs.StockLocation = co.StockLocation  
						 and co.rowid =  1 
INNER JOIN merchandising.Location l  ON l.SalesId = co.StockLocation  
INNER JOIN merchandising.product p  ON p.SKU = co.Sku  
INNER JOIN Merchandising.ProductStockLevel psl ON p.id = psl.ProductId  AND psl.LocationId = l.Id  
INNER JOIN costprice cp on cp.RowId = 1 AND cp.ProductId = p.Id

