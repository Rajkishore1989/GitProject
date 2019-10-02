IF OBJECT_ID(N'Merchandising.StockReceivedReportStockCountView') IS NOT NULL
	DROP VIEW Merchandising.StockReceivedReportStockCountView
GO

CREATE VIEW Merchandising.StockReceivedReportStockCountView
AS

WITH ReceivedQuantities(ReferenceNumberCsl, ProductId, PurchaseOrderId, ReceivedStock, QuantityOrdered, QuantityReceived, QuantityCancelled)
AS
(
    SELECT gr.ReferenceNumberCsl,
           gr.ProductId,
           gr.PurchaseOrderId,
           SUM(ISNULL(gr.Quantity,0)) as ReceivedStock,
           SUM(ISNULL(gr.QuantityOrdered, 0)) AS QuantityOrdered,
           (
                select SUM(ISNULL(gr2.Quantity,0))
                from 
                    Merchandising.GoodsReceiptResume gr2
                where 
                    gr2.ProductId = gr.ProductId
                    and gr2.PurchaseOrderId = gr.PurchaseOrderId
                    and gr2.ReferenceNumberCsl <= gr.ReferenceNumberCsl
           ) AS QuantityReceived,
           (
                select SUM(ISNULL(gr3.QuantityCancelled,0))
                from
                    Merchandising.GoodsReceiptResume gr3
                where
                    gr3.ProductId = gr.ProductId
                    and gr3.PurchaseOrderId = gr.PurchaseOrderId
                    and gr3.ReferenceNumberCsl <= gr.ReferenceNumberCsl
           ) AS QuantityCancelled
    FROM Merchandising.GoodsReceiptResume gr
    WHERE gr.[Status] != 'Cancelled'
    GROUP BY gr.ReferenceNumberCsl,
             gr.ProductId,
             gr.PurchaseOrderId
)
SELECT 
	ROW_NUMBER() OVER(ORDER BY gr.ProductId, gr.LocationId, gr.PurchaseOrderId, gr.ReferenceNumberCsl) AS Id,
	gr.LocationId,
    gr.ProductId,
    gr.PurchaseOrderId,
    gr.ReferenceNumberCsl,
    rq.ReceivedStock AS ReceivedStock,
    rq.QuantityOrdered AS OrderedStock,
    rq.QuantityCancelled AS QuantityCancelled,
    rq.QuantityOrdered - rq.QuantityReceived - rq.QuantityCancelled AS Pending
FROM Merchandising.GoodsReceiptResume gr
INNER JOIN ReceivedQuantities rq
	ON gr.ProductId = rq.ProductId
    AND gr.PurchaseOrderId = rq.PurchaseOrderId
    AND gr.ReferenceNumberCsl = rq.ReferenceNumberCsl
GROUP BY
    gr.ProductId, gr.LocationId, gr.PurchaseOrderId, gr.ReferenceNumberCsl, 
    rq.QuantityOrdered , rq.QuantityCancelled, rq.QuantityReceived, rq.ReceivedStock