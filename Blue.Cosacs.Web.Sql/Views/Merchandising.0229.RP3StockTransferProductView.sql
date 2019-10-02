IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3StockTransferProductView]')) 
	DROP VIEW [Merchandising].[RP3StockTransferProductView]
GO

CREATE VIEW [Merchandising].[RP3StockTransferProductView] 
AS

SELECT
    CONVERT(Int,ROW_NUMBER() OVER (ORDER BY StockTransferNote DESC)) as Id,
    StockTransferNote,
    ProductCode,
    SendingUnits,
    ReceivingUnits,
    UnitCost,
    UnitPrice,
    DateProcessed,
    SendingLocationId,
    ReceivingLocationId
FROM 
(
    --Direct Stock Transfer and Goods On Loan
	SELECT
		CAST(st.Id AS VARCHAR) AS StockTransferNote,
		p.SKU AS ProductCode,
		stm.Quantity AS SendingUnits,
		stm.Quantity AS ReceivingUnits,
		stm.AverageWeightedCost AS UnitCost,
		rp.CashPrice AS UnitPrice,
		stm.DateProcessed,
        lSend.SalesId AS SendingLocationId,
        lRec.SalesId AS ReceivingLocationId
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.StockTransferProduct stp
		ON st.Id = stp.StockTransferId
	INNER JOIN Merchandising.StockTransferMovement stm
		ON stm.BookingId = stp.BookingId
		AND stm.ReceivingLocationId = st.ReceivingLocationId
		AND stm.SendingLocationId = st.SendingLocationId
    INNER JOIN Merchandising.Location lRec
        ON lRec.Id = st.ReceivingLocationId
    INNER JOIN Merchandising.Location lSend
        ON lSend.Id = st.SendingLocationId
	INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
		ON stm.SendingLocationId = rp.LocationId
		AND stm.ProductId = rp.ProductId	
	INNER JOIN Merchandising.Product p
		ON stm.ProductId = p.id
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
        AND st.ViaLocationId IS NULL

    UNION

	--Via Transfer(Sending Location to Via Location)
    SELECT
		CAST(st.Id AS VARCHAR) AS StockTransferNote,
		p.SKU AS ProductCode,
		stp.Quantity AS SendingUnits,
		stp.Quantity AS ReceivingUnits,
		stp.AverageWeightedCost AS UnitCost,
		rp.CashPrice AS UnitPrice,
		st.CreatedDate AS DateProcessed,
        lSend.SalesId AS SendingLocationId,
        lVia.SalesId AS ReceivingLocationId
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.StockTransferProduct stp
		ON st.Id = stp.StockTransferId
	INNER JOIN Merchandising.Location lSend
		ON st.SendingLocationId = lSend.id
    INNER JOIN Merchandising.Location lVia
        ON st.ViaLocationId = lVia.Id
	INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
		ON st.SendingLocationId = rp.LocationId
		AND stp.ProductId = rp.ProductId
	INNER JOIN Merchandising.Product p
		ON stp.ProductId = p.id
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
        AND st.ViaLocationId IS NOT NULL

	UNION 

	--Via Transfer (Via Location to Receiving Location)

    SELECT
		CAST(st.Id AS VARCHAR) + '/' + CAST(stm.BookingId AS VARCHAR) AS StockTransferNote,
		p.SKU AS ProductCode,
		stm.Quantity AS SendingUnits,
		stm.Quantity AS ReceivingUnits,
		stm.AverageWeightedCost AS UnitCost,
		rp.CashPrice AS UnitPrice,
		stm.DateProcessed,
        lVia.SalesId AS SendingLocationId,
        lRec.SalesId AS ReceivingLocationId
	FROM Merchandising.StockTransfer st
	INNER JOIN Merchandising.StockTransferProduct stp
		ON st.Id = stp.StockTransferId
	INNER JOIN Merchandising.Location lVia
		ON st.ViaLocationId = lVia.Id
    INNER JOIN Merchandising.Location lRec
        ON st.ReceivingLocationId = lRec.Id
	INNER JOIN Merchandising.StockTransferMovement stm
		ON stm.BookingId = stp.BookingId
		AND stm.ReceivingLocationId = st.ReceivingLocationId
		AND stm.SendingLocationId = st.ViaLocationId
	INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
		ON st.ViaLocationId = rp.LocationId
		AND stm.ProductId = rp.ProductId
	INNER JOIN Merchandising.Product p
		ON stm.ProductId = p.id
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
        AND st.ViaLocationId IS NOT NULL

	UNION

    --Stock Requision
    SELECT
		CAST(srp.BookingId AS VARCHAR) AS StockTransferNote,
		p.SKU AS ProductCode,
		stm.Quantity AS SendingUnits,
		stm.Quantity AS ReceivingUnits,
		stm.AverageWeightedCost AS UnitCost,
		rp.CashPrice AS UnitPrice,
		stm.DateProcessed,
        lSend.SalesId AS SendingLocationId,
        lRec.SalesId AS ReceivingLocationId
    FROM Merchandising.StockTransferMovement stm
    INNER JOIN Merchandising.StockRequisitionProduct srp
        ON stm.BookingId = srp.BookingId
    INNER JOIN Merchandising.Product p
		ON stm.ProductId = p.id
    INNER JOIN Merchandising.Location lRec
        ON stm.ReceivingLocationId = lRec.Id
    INNER JOIN Merchandising.Location lSend
        ON stm.SendingLocationId = lSend.Id
    INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
		ON stm.SendingLocationId = rp.LocationId
		AND stm.ProductId = rp.ProductId
	WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')

    UNION

    --Stock Allocation
    SELECT
        CAST(sap.BookingId AS VARCHAR) AS StockTransferNote,
		sap.Sku AS ProductCode,
		sap.QuantityReceived AS SendingUnits,
		sap.QuantityReceived AS ReceivingUnits,
		sap.AverageWeightedCost AS UnitCost,
		rp.CashPrice AS UnitPrice,
		sap.CompletedOn AS DateProcessed,
        sap.WarehouseSalesLocationId AS SendingLocationId,
        sap.ReceivingSalesLocationId AS ReceivingLocationId
    FROM Merchandising.StockAllocationProductView sap
    INNER JOIN Merchandising.CurrentStockPriceByLocationView rp
        ON rp.LocationId = sap.WarehouseLocationId
        AND rp.ProductId = sap.ProductId
    INNER JOIN Merchandising.Product p
		ON p.id = sap.ProductId
    WHERE sap.[Status] = 'Completed'
        AND p.ProductType IN ('ProductWithoutStock', 'RegularStock')
) AS INNERQUERY
GO