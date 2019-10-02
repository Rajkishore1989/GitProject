IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[VendorReturnDirectProductView]'))
DROP VIEW  [Merchandising].[VendorReturnDirectProductView]
GO

CREATE VIEW [Merchandising].[VendorReturnDirectProductView]
AS

SELECT
ISNULL(CONVERT(Int,ROW_NUMBER() OVER (ORDER BY productid DESC)), 0) as Id, 
	grp.Id [GoodsReceiptProductId], 
	gr.Id [GoodsReceiptId], 
	grp.ProductId, 
	grp.Sku [ProductCode], 
	grp.[Description]  , 
	grp.QuantityReceived  , 
	grp.UnitLandedCost as LastLandedCost, 
	vrp.Comments, 
	vr.Id [VendorReturnId], 
	vr.CreatedDate, 
	gr.LocationId AS GoodsReceiptLocationId, 
	gr.VendorId, 
	gr.Vendor,
	ISNULL(vrp.QuantityReturned, 0) AS QuantityReturned,
	(
		SELECT sum(vrp2.QuantityReturned) 
		FROM Merchandising.VendorReturn vr2
		INNER JOIN Merchandising.VendorReturnProduct vrp2 
			ON vr2.Id = vrp2.VendorReturnId
		WHERE vr2.Id != vr.Id
			AND vr2.ReceiptType = vr.ReceiptType
			AND vrp2.GoodsReceiptProductId = grp.Id
		GROUP BY vrp2.GoodsReceiptProductId
	) as QuantityPreviouslyReturned
FROM Merchandising.GoodsReceiptDirect gr
INNER JOIN Merchandising.GoodsReceiptDirectProduct grp 
	ON grp.GoodsReceiptDirectId = gr.Id
LEFT JOIN Merchandising.VendorReturn vr 
	ON vr.GoodsReceiptId = gr.Id 
	AND vr.ReceiptType = 'Direct'
LEFT JOIN Merchandising.VendorReturnProduct vrp 
	ON vrp.VendorReturnId = vr.Id 
	AND grp.id = vrp.GoodsReceiptProductId