IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[HyperionGoodsReceivedView]'))
DROP VIEW  [Merchandising].[HyperionGoodsReceivedView]
GO

CREATE VIEW [Merchandising].[HyperionGoodsReceivedView]
AS 
SELECT 
	Id AS Id
	,LocationId
	, SUM(QuantityReceived) AS TotalReceived
	, SUM(QuantityReceived * LastLandedCost) AS TotalCost
FROM ( 
	SELECT
		p.Id,
		l.Id as LocationId,
		vrp.QuantityReturned * -1  as QuantityReceived,
		Coalesce(grp.LastLandedCost, drp.UnitLandedCost) as LastLandedCost,
		ps.Name,
		vr.CreatedDate as DateReceived
	FROM Merchandising.VendorReturn vr
	INNER JOIN Merchandising.VendorReturnProduct vrp
		ON vrp.VendorReturnId = vr.Id
	LEFT JOIN Merchandising.GoodsReceipt gr 
		ON vr.GoodsReceiptId = gr.Id 
		AND vr.ReceiptType = 'Standard'
	LEFT JOIN Merchandising.GoodsReceiptProductView grp 
		ON grp.GoodsReceiptId = gr.Id
		AND grp.Id = vrp.GoodsReceiptProductId
	LEFT JOIN Merchandising.GoodsReceiptDirect dr 
		ON vr.GoodsReceiptId = dr.Id 
		AND vr.ReceiptType = 'Direct'
	LEFT JOIN Merchandising.GoodsReceiptDirectProduct drp
		ON dr.Id = drp.ProductId
	LEFT JOIN Merchandising.Location l 
		ON gr.LocationId = l.Id 
		OR dr.LocationId = l.Id
	LEFT JOIN merchandising.PurchaseOrderProduct pop 
		ON grp.PurchaseOrderProductId = pop.Id
	LEFT JOIN merchandising.Product p
		ON p.Id = pop.ProductId
		OR p.Id = drp.ProductId
	LEFT JOIN Merchandising.ProductStatus ps 
		ON ps.Id = p.[Status]
	WHERE QuantityReturned > 0
	UNION ALL
	SELECT 
		p.Id
		,loc.Id as LocationId
		, grp.QuantityReceived
		, grp.LastLandedCost
		, ps.Name
		, gr.CostConfirmed as DateReceived
	FROM merchandising.product p
		INNER JOIN merchandising.PurchaseOrderProduct pop ON pop.ProductId = p.id	
		INNER JOIN merchandising.GoodsReceiptProduct grp ON grp.PurchaseOrderProductId = pop.Id
		INNER JOIN merchandising.GoodsReceipt gr ON gr.Id = grp.GoodsReceiptId 
		INNER JOIN Merchandising.Location loc on loc.Id = gr.LocationId
		INNER JOIN Merchandising.ProductStatus ps ON ps.Id = p.[Status]
	WHERE QuantityReceived > 0
		and costconfirmed is not null
	UNION ALL
	SELECT 
		p.Id
		,loc.Id as LocationId
		, grp.QuantityReceived
		, grp.UnitLandedCost AS LastLandedCost
		, ps.Name
		, gr.DateReceived
	FROM merchandising.product p	
		INNER JOIN merchandising.GoodsReceiptDirectProduct grp ON grp.ProductId = p.Id
		INNER JOIN merchandising.GoodsReceiptDirect gr ON gr.Id = grp.GoodsReceiptDirectId
		INNER JOIN Merchandising.Location loc on loc.Id = gr.LocationId
		INNER JOIN Merchandising.ProductStatus ps ON ps.Id = p.[Status]
	WHERE QuantityReceived > 0	
) AS Goods
WHERE 
	DATEPART(m, Goods.DateReceived) = DATEPART(m, DATEADD(m, -1, getdate()))
	AND DATEPART(yyyy, Goods.DateReceived) = DATEPART(yyyy, DATEADD(m, -1, getdate()))
	AND (Goods.name != 'Deleted' OR EXISTS(select * from Merchandising.ProductStockLevel psl2 where psl2.productid = Goods.id AND psl2.StockOnHand > 0))	
GROUP BY Goods.Id, Goods.LocationId
GO