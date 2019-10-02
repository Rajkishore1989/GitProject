IF OBJECT_ID(N'Merchandising.StockReceivedReportView') IS NOT NULL
	DROP VIEW Merchandising.StockReceivedReportView
GO

CREATE VIEW Merchandising.StockReceivedReportView
AS

SELECT 
	ROW_NUMBER() OVER (ORDER BY [Date]) Id,
	Division, 
	Department, 
	Class, 
	ReferenceNumberCsl, 
	LocationId, 
	ProductId, 
	[Date], 
	UTCDate, 
	sum(Quantity) AS Quantity, 
	LastLandedCost, 
	VendorId, 
	PurchaseOrderId, 
	SKU, 
	Description, 
	Vendor, 
	StockOnHand, 
	ExtendedLandedCost
FROM 
(
	SELECT
		ph.DivisionName AS Division,
		ph.DepartmentName AS Department,
		ph.ClassName AS Class,
		gr.ReferenceNumberCsl,	
		gr.locationid AS LocationId,
		gr.productid AS ProductId,
		gr.datereceived AS [Date],
		NULL AS [UTCDate],
		sum(gr.Quantity) as Quantity,	
		gr.LastLandedCost,	
		gr.VendorId,
		gr.PurchaseOrderId,	
		gr.sku AS SKU,
		gr.Description,
		gr.VendorName AS Vendor,
		ISNULL(psl.stockonhand, 0) AS StockOnHand,
		ISNULL(gr.lastlandedcost, 0) * sum(gr.quantity) AS ExtendedLandedCost
	FROM Merchandising.GoodsReceiptResume gr
	LEFT JOIN Merchandising.productstocklevel psl 
		ON psl.productid = gr.productid 
		AND psl.locationid = gr.locationid
	LEFT JOIN Merchandising.ProductHierarchySummaryView ph 
		ON ph.productid = gr.ProductId
    GROUP BY
        ph.DivisionName,
        ph.DepartmentName,
        ph.ClassName,
        gr.ReferenceNumberCsl,
        gr.locationid,
        gr.productid,
        gr.datereceived,
        gr.LastLandedCost,
        gr.VendorId,
        gr.PurchaseOrderId,
        gr.sku,
        gr.Description,
        gr.VendorName,
        psl.stockonhand

	UNION ALL

	SELECT
		ph.DivisionName AS Division,
		ph.DepartmentName AS Department,
		ph.ClassName AS Class,
		vr.id AS ReferenceNumberCsl,
		gr.locationid,
		gr.productid,
		vr.createddate AS [Date],
		vr.createddate AS UTCDate,
		0 - vrp.quantityreturned AS Quantity,
		gr.lastlandedcost,
		gr.vendorid,
		gr.purchaseorderid,
		gr.sku AS SKU,
		gr.Description,
		gr.VendorName AS Vendor,
		ISNULL(psl.stockonhand, 0) AS StockOnHand,
		-ISNULL(gr.lastlandedcost, 0) * vrp.QuantityReturned AS ExtendedLandedCost
	FROM Merchandising.VendorReturn vr
	INNER JOIN Merchandising.vendorreturnproduct vrp 
		ON vrp.vendorreturnid = vr.id 
		AND vr.receipttype != 'Direct'
	INNER JOIN Merchandising.GoodsReceiptResume gr 
		ON vr.goodsreceiptid = gr.ReferenceNumberCsl 
		AND vrp.goodsreceiptproductid = gr.ReceiptProductId
	LEFT JOIN Merchandising.productstocklevel psl 
		ON psl.productid = gr.productid 
		AND psl.locationid = gr.locationid
	LEFT JOIN Merchandising.ProductHierarchySummaryView ph 
		ON ph.productid = gr.ProductId
) Data
GROUP BY 
    Division, 
	Department, 
	Class, 
	ReferenceNumberCsl, 
	LocationId, 
	ProductId, 
	[Date], 
	UTCDate,
    LastLandedCost, 
	VendorId, 
	PurchaseOrderId, 
	SKU, 
	Description, 
	Vendor, 
	StockOnHand, 
	ExtendedLandedCost


