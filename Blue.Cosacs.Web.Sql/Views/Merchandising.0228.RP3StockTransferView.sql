IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3StockTransferView]'))
	DROP VIEW [Merchandising].[RP3StockTransferView]
GO

CREATE VIEW [Merchandising].[RP3StockTransferView]
AS

SELECT 
	CONVERT(INT, ROW_NUMBER() OVER (ORDER BY StockTransferNote DESC)) AS Id,
	StockTransferNote,
	TransferType,
	SendingLocationCode,
	SendingLocationName,
	ViaLocationCode,
	ViaLocationName,
	ReceivingLocationCode,
	ReceivingLocationName,
	TransactionDate
FROM 
(
	--Direct transfers and Goods On Loan
	SELECT DISTINCT
        CAST(st.Id AS VARCHAR) AS StockTransferNote,
		CASE 
			WHEN glDelivery.Id IS NOT NULL THEN 'Goods On Loan (Collect)'
			WHEN glCollect.Id IS NOT NULL THEN 'Goods On Loan (Delivery)'
			ELSE stm.[Type] 
		END AS TransferType,
		lSend.SalesId AS SendingLocationCode,
		lSend.Name AS SendingLocationName,
		CAST('0' AS VARCHAR(100)) AS ViaLocationCode,
		CAST('' AS VARCHAR(100)) AS ViaLocationName,
		lRec.SalesId AS ReceivingLocationCode,
		lRec.Name AS ReceivingLocationName,
		CAST(stm.DateProcessed AS DATE) AS TransactionDate
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.StockTransferProduct stp
		ON st.Id = stp.StockTransferId
	INNER JOIN Merchandising.Location lSend
		ON st.SendingLocationId = lSend.id
	INNER JOIN Merchandising.Location lRec
		ON st.ReceivingLocationId = lRec.Id
	INNER JOIN Merchandising.StockTransferMovement stm
		ON stm.BookingId = stp.BookingId
		AND stm.ReceivingLocationId = lRec.Id
		AND stm.SendingLocationId =  lSend.Id
	INNER JOIN Merchandising.Product p
		ON p.Id = stp.ProductId
	LEFT JOIN Merchandising.GoodsOnLoan glDelivery
		ON glDelivery.StockTransferId = st.Id
	LEFT JOIN Merchandising.GoodsOnLoan glCollect
		ON glCollect.ReturnStockTransferId = st.Id
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
		AND st.ViaLocationId IS NULL
	
	UNION

	--Via transfers (Original Location To Via Location)
	SELECT 
		CAST(st.Id AS VARCHAR) AS StockTransferNote,
		CAST('ViaTransfer' AS VARCHAR(14)) AS TransferType,
		lSend.SalesId AS SendingLocationCode,
		lSend.Name AS SendingLocationName,
		lVia.SalesId AS ViaLocationCode,
		lVia.Name AS ViaLocationName,
		lVia.SalesId AS ReceivingLocationCode,
		lVia.Name AS ReceivingLocationName,
		st.CreatedDate AS TransactionDate
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.Location lSend
		ON st.SendingLocationId = lSend.id
	INNER JOIN Merchandising.Location lVia
		ON st.ViaLocationId = lVia.Id
	WHERE EXISTS(SELECT 'a' 
                 FROM Merchandising.StockTransferProduct stp
                 INNER JOIN Merchandising.Product p
                 ON stp.ProductId = p.Id
                 WHERE stp.StockTransferId = st.Id
                    AND p.ProductType IN ('ProductWithoutStock', 'RegularStock'))
		AND st.ViaLocationId IS NOT NULL

	UNION 

	--Via transfers (Via Location To Receiving Location)
	SELECT 
		CAST(st.Id AS VARCHAR) + '/' + CAST(stm.BookingId AS VARCHAR) AS StockTransferNote,
		stm.[Type] AS TransferType,
		lVia.SalesId AS SendingLocationCode,
		lVia.Name AS SendingLocationName,
		lVia.SalesId AS ViaLocationCode,
		lVia.Name AS ViaLocationName,
		lRec.SalesId AS ReceivingLocationCode,
		lRec.Name AS ReceivingLocationName,
		stm.DateProcessed AS TransactionDate
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.StockTransferProduct stp
		ON st.Id = stp.StockTransferId
	INNER JOIN Merchandising.Location lVia
		ON st.ViaLocationId = lVia.Id
	INNER JOIN Merchandising.Location lRec
		ON st.ReceivingLocationId = lRec.Id
	INNER JOIN Merchandising.StockTransferMovement stm
		ON stm.BookingId = stp.BookingId
		AND stm.ReceivingLocationId = lRec.Id
		AND stm.SendingLocationId = lVia.Id
	INNER JOIN Merchandising.Product p
		ON p.Id = stp.ProductId
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
		AND st.ViaLocationId IS NOT NULL
			
	UNION

	--Stock Requisitions
	SELECT 
		CAST(srp.BookingId AS VARCHAR) AS StockTransferNote,
		ISNULL(stm.[Type], 'Requisition') AS TransferType,
		lSend.SalesId AS SendingLocationCode,
		lSend.Name AS SendingLocationName,
		0 AS ViaLocationCode,
		CAST('' AS VARCHAR(100)) AS ViaLocationName,
		lRec.SalesId AS ReceivingLocationCode,
		lRec.Name AS ReceivingLocationName,
		stm.DateProcessed AS TransactionDate
	FROM Merchandising.StockRequisitionProduct srp
	INNER JOIN Merchandising.Location lSend
		ON srp.WarehouseLocationId = lSend.id
	INNER JOIN Merchandising.Location lRec
		ON srp.ReceivingLocationId = lRec.Id
	INNER JOIN Merchandising.Product p
		ON p.Id = srp.ProductId
	LEFT JOIN Merchandising.StockTransferMovement stm
		ON stm.BookingId = srp.BookingId
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')

	UNION

	--Stock Allocations
	SELECT 
		CAST(sap.BookingId AS VARCHAR) AS StockTransferNote,
		'Stock Allocation' AS TransferType,  
		sap.WarehouseSalesLocationId AS SendingLocationCode,
		sap.WarehouseLocation AS SendingLocationName,
		0 AS ViaLocationCode,
		CAST('' AS VARCHAR(100)) AS ViaLocationName,
		sap.ReceivingSalesLocationId AS ReceivingLocationCode,
		sap.ReceivingLocation AS ReceivingLocationName,
		sap.CompletedOn AS TransactionDate
	FROM Merchandising.StockAllocationProductView sap
	WHERE sap.[Status] = 'Completed'
) AS INNERQUERY