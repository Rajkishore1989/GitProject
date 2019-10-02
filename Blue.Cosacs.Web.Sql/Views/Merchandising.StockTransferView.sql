IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockTransferView]'))
DROP VIEW  [Merchandising].[StockTransferView]
GO

CREATE VIEW [Merchandising].[StockTransferView] as

WITH Totals
AS
(
	SELECT
		stp.StockTransferId,
		SUM(stp.Quantity * stp.AverageWeightedCost) as Total
	FROM Merchandising.StockTransferProduct stp
	GROUP BY stp.StockTransferId
)

SELECT
	st.Id,
	st.SendingLocationId,
	st.ReceivingLocationId,
	st.ViaLocationId,
	st.ReferenceNumber,
	st.Comments,
	st.OriginalPrint,
	st.CreatedDate,
	st.CreatedById,
	u.FullName AS CreatedBy,
	stp.Total
FROM Merchandising.StockTransfer st
LEFT JOIN [Admin].[User] u
	ON st.CreatedById = u.Id
INNER JOIN totals stp
	ON st.id = stp.StockTransferId