IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'Merchandising.[RP3StockAdjustmentView]')) 
	DROP VIEW Merchandising.[RP3StockAdjustmentView]
GO

CREATE VIEW [Merchandising].[RP3StockAdjustmentView]
AS

SELECT
	sa.Id,
	sa.Id AS StockAdjustmentNumber,
	sapr.Name AS PrimaryReason,
	sasr.SecondaryReason,
	saSummary.ReasonSign,
	l.SalesId AS LocationCode,
	l.Name AS LocationName,
	sa.CreatedDate AS TransactionDate,
	ABS(saSummary.ExtendedCost) AS ExtendedCost,
	ABS(saSummary.ExtendedPrice) AS ExtendedPrice,
	sa.Comments AS Notes,
	CASE 
		WHEN AuthorisedDate IS NOT NULL THEN 'Approved' 
		ELSE 'Pending Approval' 
	END AS AdjustmentStatus
FROM 
(
	SELECT 
		sap.StockAdjustmentId, 
		SUM(sap.Quantity * sap.AverageWeightedCost) AS ExtendedCost, 
		CASE 
			WHEN sap.Quantity <= 0 THEN '-' 
			ELSE '+' 
		END AS ReasonSign,
		SUM(rp.CashPrice * sap.Quantity) AS ExtendedPrice
	FROM Merchandising.StockAdjustmentProduct sap
	INNER JOIN Merchandising.StockAdjustment sa
		ON sap.StockAdjustmentId = sa.Id
	INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
		ON sap.ProductId = rp.ProductId
		AND sa.LocationId = rp.locationid
	INNER JOIN Merchandising.Product p
		ON p.Id = rp.ProductId
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
	GROUP BY 
		sap.StockAdjustmentId, 
		CASE 
			WHEN sap.Quantity <= 0 THEN '-' 
			ELSE '+' 
		END
) saSummary
INNER JOIN Merchandising.StockAdjustment sa
	ON saSummary.StockAdjustmentId = sa.Id
INNER JOIN Merchandising.StockAdjustmentPrimaryReason sapr
	ON sa.PrimaryReasonId = sapr.id
INNER JOIN Merchandising.StockAdjustmentSecondaryReason sasr
	ON sa.SecondaryReasonId = sasr.Id
INNER JOIN Merchandising.Location l
	ON sa.LocationId = l.Id
