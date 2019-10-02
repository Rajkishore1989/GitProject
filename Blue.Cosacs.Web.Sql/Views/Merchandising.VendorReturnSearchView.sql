IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[VendorReturnSearchView]'))
DROP VIEW  [Merchandising].[VendorReturnSearchView]
GO

CREATE VIEW [Merchandising].[VendorReturnSearchView] 
AS
SELECT 
	 vr.Id
	,VendorReturnId
	,vr.CreatedDate
	,vrp.VendorId
	,vrp.Vendor
	,gr.LocationId
	,gr.Location
	,CASE WHEN vr.ApprovedById IS NULL THEN 0 ELSE 1 END AS Approved
	,CASE WHEN vr.ApprovedById IS NULL THEN 'Pending Approval' ELSE 'Approved' END AS [Status]
	,vr.GoodsReceiptId
	,sum(vrp.LastLandedCost * vrp.QuantityReturned) as TotalCost
	,vr.ReceiptType GoodsReceiptType 
FROM
	merchandising.VendorReturn vr
	join
	merchandising.VendorReturnProductView vrp on vr.id = vrp.VendorReturnId
	join
	merchandising.GoodsReceipt gr on gr.Id = vr.GoodsReceiptId
where
	vr.ReceiptType = 'Standard'
GROUP BY
	 vr.Id
	,VendorReturnId
	,vr.CreatedDate
	,vrp.VendorId
	,vrp.Vendor
	,gr.LocationId
	,gr.Location
	,vr.ApprovedById
	,vr.GoodsReceiptId
	,vr.ReceiptType

UNION ALL

select 
	 vr.Id
	,VendorReturnId
	,vr.CreatedDate
	,vrp.VendorId
	,vrp.Vendor
	,gr.LocationId
	,gr.Location
	,CASE WHEN vr.ApprovedById IS NULL THEN 0 ELSE 1 END AS Approved
	,CASE WHEN vr.ApprovedById IS NULL THEN 'Pending Approval' ELSE 'Approved' END AS [Status]
	,vr.GoodsReceiptId
	,sum(vrp.LastLandedCost * vrp.QuantityReturned) as TotalCost 
	,vr.ReceiptType GoodsReceiptType 
FROM
	merchandising.VendorReturn vr
	join
	merchandising.VendorReturnDirectProductView vrp on vr.id = vrp.VendorReturnId
	join
	merchandising.GoodsReceiptDirect gr on gr.Id = vr.GoodsReceiptId
where
	vr.ReceiptType = 'Direct'
GROUP BY
	 vr.Id
	,VendorReturnId
	,vr.CreatedDate
	,vrp.VendorId
	,vrp.Vendor
	,gr.LocationId
	,gr.Location
	,vr.ApprovedById
	,vr.GoodsReceiptId
	,vr.ReceiptType