IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentStockCostPriceView]'))
	DROP VIEW  [Merchandising].[CurrentStockCostPriceView]
GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentStockAWCPriceView]'))
	DROP VIEW [Merchandising].[CurrentStockAWCPriceView]
GO

CREATE VIEW [Merchandising].[CurrentStockAWCPriceView]
AS

SELECT 
	Id,
	ProductId,
	SupplierCost,
	LastLandedCost,
	AverageWeightedCost,
	SupplierCurrency,
	LastLandedCostUpdated,
	AverageWeightedCostUpdated
FROM Merchandising.CostPrice cp
WHERE Id = (
	SELECT TOP 1 Id
	FROM Merchandising.CostPrice cp2
	WHERE cp.ProductId = cp2.ProductId
	ORDER BY 
		AverageWeightedCostUpdated DESC,
		LastLandedCostUpdated DESC,
		Id DESC
)

GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentSetCostPriceView]'))
	DROP VIEW [Merchandising].[CurrentSetCostPriceView]
GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentSetAWCPriceView]'))
	DROP VIEW [Merchandising].[CurrentSetAWCPriceView]
GO

CREATE VIEW [Merchandising].[CurrentSetAWCPriceView]
AS

SELECT
	s.SetId as Id,
	s.SetId as ProductId,
	0 as SupplierCost,
	ISNULL(SUM(Quantity * LastLandedCost),0) as LastLandedCost,
	ISNULL(SUM(Quantity * AverageWeightedCost),0) as AverageWeightedCost,
	CONVERT(varchar, NULL) as SupplierCurrency,
	ISNULL(MAX(LastLandedCostUpdated),0) as LastLandedCostUpdated,
	MAX(AverageWeightedCostUpdated) as AverageWeightedCostUpdated
FROM Merchandising.SetProduct s
INNER JOIN Merchandising.[CurrentStockAWCPriceView] p
	ON p.Productid = s.ProductId
GROUP BY s.SetId
GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentComboCostPriceView]'))
	DROP VIEW [Merchandising].[CurrentComboCostPriceView]
GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentComboAWCPriceView]'))
	DROP VIEW [Merchandising].[CurrentComboAWCPriceView]
GO

CREATE VIEW [Merchandising].[CurrentComboAWCPriceView]
AS

SELECT
	s.ComboId as Id,
	s.ComboId as ProductId,
	0 as SupplierCost,
	ISNULL(SUM(Quantity * LastLandedCost),0) as LastLandedCost,
	ISNULL(SUM(Quantity * AverageWeightedCost),0) as AverageWeightedCost,
	CONVERT(varchar, NULL) as SupplierCurrency,
	ISNULL(MAX(LastLandedCostUpdated),0) as LastLandedCostUpdated,
	MAX(AverageWeightedCostUpdated) as AverageWeightedCostUpdated
FROM Merchandising.ComboProduct s
INNER JOIN Merchandising.[CurrentStockAWCPriceView] p
	ON p.Productid = s.ProductId
GROUP BY s.ComboId

GO

IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[CurrentCostPriceView]'))
	DROP VIEW [Merchandising].[CurrentCostPriceView]
GO

CREATE VIEW [Merchandising].[CurrentCostPriceView]
AS

SELECT
	ProductId as Id,
	ProductId,
	SupplierCost,
	LastLandedCost,
	AverageWeightedCost,
	SupplierCurrency,
	LastLandedCostUpdated,
	AverageWeightedCostUpdated
FROM Merchandising.[CurrentStockAWCPriceView]
UNION
SELECT
	ProductId as Id,
	ProductId,SupplierCost,
	LastLandedCost,
	AverageWeightedCost,
	SupplierCurrency,
	LastLandedCostUpdated,
	AverageWeightedCostUpdated
FROM Merchandising.[CurrentSetAWCPriceView]
UNION
SELECT
	ProductId as Id,
	ProductId,
	SupplierCost,
	LastLandedCost,
	AverageWeightedCost,
	SupplierCurrency,
	LastLandedCostUpdated,
	AverageWeightedCostUpdated
FROM Merchandising.[CurrentComboAWCPriceView]

GO




