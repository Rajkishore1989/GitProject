IF OBJECT_ID('Merchandising.RecreateDataForGoodsReceiptResume') IS NOT NULL
	DROP PROCEDURE Merchandising.RecreateDataForGoodsReceiptResume
GO

CREATE PROCEDURE Merchandising.RecreateDataForGoodsReceiptResume
WITH EXECUTE AS OWNER
AS
	TRUNCATE TABLE Merchandising.GoodsReceiptResume

	INSERT INTO Merchandising.GoodsReceiptResume
		(ReferenceNumberCsl,
		DateReceived,
		LocationId,
		[Date],
		Quantity,
		LastLandedCost,
		ProductId,
		VendorId,
		VendorName,
		PurchaseOrderId,
		SKU,
		Description,
		Status,
		ReceivingLocationId,
		QuantityCancelled,
		QuantityOrdered,
		ReceiptProductId)
	SELECT
		gr.id AS ReferenceNumberCsl,
		gr.DateReceived,
		gr.LocationId,
		gr.datereceived AS [Date],
		gr.quantityreceived AS Quantity,
		gr.LastLandedCost,
		po.ProductId,
		po.VendorId,
		po.VendorName,
		po.PurchaseOrderId,
		po.SKU,
		po.longdescription AS Description,
		po.Status,
		po.ReceivingLocationId,
		gr.QuantityCancelled,
		po.QuantityOrdered,
		gr.ReceiptProductId
	FROM
	(
		SELECT
			gr.id,
			gr.datereceived,
			grp.quantityreceived,
			grp.lastlandedcost,
			gr.locationid,
			grp.purchaseorderproductid,
			grp.quantitycancelled,
			grp.Id AS ReceiptProductId
		FROM Merchandising.goodsreceipt gr
		INNER JOIN merchandising.goodsreceiptproduct grp  
			ON grp.goodsreceiptid = gr.id
		WHERE grp.quantityreceived != 0
	) GR
	INNER JOIN
	(
		SELECT
			pop.Id,
			po.vendorid,
			po.Vendor AS VendorName,
			pop.productid,
			pop.purchaseorderid,
			pop.quantityordered,
			pop.quantitycancelled,
			po.receivinglocationid,
			po.Status,
			p.SKU,
			p.LongDescription
		FROM merchandising.purchaseorderproduct pop
		INNER JOIN merchandising.purchaseorder po 
			ON pop.purchaseorderid = po.id
		INNER JOIN merchandising.product p 
			ON p.id = pop.productid 
			AND p.producttype = 'RegularStock'
	) po
		ON gr.purchaseorderproductid = po.id
