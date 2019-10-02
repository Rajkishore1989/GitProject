IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CostPriceView]'))
DROP VIEW  [Merchandising].[CostPriceView]
GO

CREATE VIEW [Merchandising].[CostPriceView]
AS

SELECT 
	CONVERT(Int,ROW_NUMBER() OVER (ORDER BY productId, AverageWeightedCostUpdated desc)) as Id,
	ProductId,
	SupplierCost,
	LastLandedCost,
	AverageWeightedCost,
	SupplierCurrency,
	LastLandedCostUpdated,
	AverageWeightedCostUpdated
FROM 
( 
	SELECT 
		ProductId,
		SupplierCost,
		LastLandedCost,
		AverageWeightedCost,
		SupplierCurrency,
		LastLandedCostUpdated,
		AverageWeightedCostUpdated
	FROM [Merchandising].[CostPrice] cp

	UNION ALL 

	SELECT  
		s.SetId as ProductId, 0 as SupplierCost, 
		SUM(Quantity * LastLandedCost) as LastLandedCost, 
		SUM(Quantity * AverageWeightedCost) as AverageWeightedCost, 
		NULL as SupplierCurrency, 
		MAX(LastLandedCostUpdated) as LastLandedCostUpdated, 
		MAX(AverageWeightedCostUpdated) as AverageWeightedCostUpdated
	FROM Merchandising.SetProduct s
	INNER JOIN Merchandising.[CostPrice] p 
		ON p.Productid = s.ProductId
	GROUP BY s.SetId

	UNION ALL

	SELECT  
		s.ComboId as ProductId, 0 as SupplierCost, 
		SUM(Quantity * LastLandedCost) as LastLandedCost, 
		SUM(Quantity * AverageWeightedCost) as AverageWeightedCost, 
		NULL as SupplierCurrency, 
		MAX(LastLandedCostUpdated) as LastLandedCostUpdated, 
		MAX(AverageWeightedCostUpdated) as AverageWeightedCostUpdated
	FROM Merchandising.ComboProduct s
	INNER JOIN Merchandising.[CostPrice] p 
		ON p.Productid = s.ProductId
	GROUP BY s.ComboId
) as V

GO

