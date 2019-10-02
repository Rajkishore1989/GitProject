IF OBJECT_ID('Merchandising.StockEvaluationSnapshotRefresh') IS NOT NULL
	DROP PROCEDURE Merchandising.StockEvaluationSnapshotRefresh
GO 

CREATE PROCEDURE Merchandising.StockEvaluationSnapshotRefresh		
@date int
AS

BEGIN

DELETE s
FROM Merchandising.StockValuationSnapshot s
WHERE s.SnapshotDateId = @date

INSERT INTO Merchandising.StockValuationSnapshot
      (ProductId, LocationId, StockOnHandQuantity, StockOnHandValue, StockOnHandSalesValue, SnapshotDateId, CashPrice)
SELECT ProductId, LocationId, StockOnHandQuantity, StockOnHandValue, StockOnHandSalesValue, @date, CashPrice
FROM merchandising.StockValuationSummaryView
END

