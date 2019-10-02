IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockMovementReportView]'))
	DROP VIEW [Merchandising].[StockMovementReportView]
GO


CREATE VIEW [Merchandising].[StockMovementReportView] AS	

-- NOTE: System acts like isnull([DateProcessedUTC], DateProcessed) and isnull([DateUTC], Date) in front end.
SELECT
	row_number() over( order by [DateProcessedUTC] ) id,
	ph.DivisionName [Division],
	ph.DepartmentName [Department],
	ph.ClassName [Class],
	TransactionId,
	x.ProductId,
	p.SKU,
	p.LongDescription,
	b.BrandName,
	p.Tags as ProductTags,
	l.Id [LocationId],
	l.Name [Location],
	l.Fascia,
	[Type],
	Narration,
	Quantity,
	[Date],
	[DateUTC],
	DateProcessedUTC,
	UserId,
	u.FullName [User],
	x.IsDirect, 
	x.SendingLocationId,
	x.ReceivingLocationId
FROM
(
--------- DIRECT TRANSFER SENDING LOCATION---------------
	(select
		convert(varchar(max), t.Id) [TransactionId],
		tp.ProductId,
		t.SendingLocationId [LocationId],
		'Transfer' [Type],
		 'Stock Transfer (Direct) #' + convert(varchar(max), t.Id) + ' - From {0} to {1} (' + ISNULL(t.ReferenceNumber, 'No reference') + ')' Narration,
		isnull(0 - tp.Quantity,0) [Quantity],
		null [Date],
		t.CreatedDate [DateUTC],
		t.CreatedDate [DateProcessedUTC],
		t.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransfer t
		join Merchandising.StockTransferProduct tp on t.id = tp.StockTransferId and t.ViaLocationId is null
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
	UNION ALL
--------- DIRECT TRANSFER RECEIVING LOCATION---------------
	(select
		convert(varchar(max), t.Id) [TransactionId],
		tp.ProductId,
		t.ReceivingLocationId [LocationId],
		'Transfer' [Type],
		'Stock Transfer (Direct) #' + convert(varchar(max), t.Id) + ' - From {0} to {1} (' + ISNULL(t.ReferenceNumber, 'No reference') + ')' Narration,
		tp.Quantity,
		null [Date],
		t.CreatedDate [DateUTC],
		t.CreatedDate [DateProcessedUTC],
		t.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransfer t
		join Merchandising.StockTransferProduct tp on t.id = tp.StockTransferId and t.ViaLocationId is null
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all

--------- VIA FIRST TRANSFER SENDING LOCATION---------------
	(select
		convert(varchar(max), t.Id) [TransactionId],
		tp.ProductId,
		t.SendingLocationId [LocationId],
		'Transfer' [Type],
		 'Stock Transfer (Via) #' + convert(varchar(max), t.Id) + ' - From {0} to {1} (' + ISNULL(t.ReferenceNumber, 'No reference') + ')' Narration,
		isnull(0 - tp.Quantity,0) [Quantity],
		null [Date],
		t.CreatedDate [DateUTC],
		t.CreatedDate [DateProcessedUTC],
		t.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransfer t
		join Merchandising.StockTransferProduct tp on t.id = tp.StockTransferId and t.ViaLocationId is not null
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- VIA FIRST TRANSFER RECEIVING LOCATION---------------
	(select
		convert(varchar(max), t.Id) [TransactionId],
		tp.ProductId,
		t.ViaLocationId [LocationId],
		'Transfer' [Type],
		'Stock Transfer (Via) #' + convert(varchar(max), t.Id) + ' - From {0} to {1} (' + ISNULL(t.ReferenceNumber, 'No reference') + ')' Narration,
		tp.Quantity,
		null [Date],
		t.CreatedDate [DateUTC],
		t.CreatedDate [DateProcessedUTC],
		t.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransfer t
		join Merchandising.StockTransferProduct tp on t.id = tp.StockTransferId and t.ViaLocationId is not null
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all

--------- VIA SECOND TRANSFER SENDING LOCATION---------------
	(select
		convert(varchar(max), tr.Id) [TransactionId],
		tp.ProductId,
		t.SendingLocationId [LocationId],
		'Transfer' [Type],
		'Stock Transfer (Via) #' + convert(varchar(max), tr.Id) + ' - From {0} to {1} (' + ISNULL(tr.ReferenceNumber, 'No reference') + ')' Narration,
		isnull(0 - t.Quantity,0) [Quantity],
		null [Date],
		tr.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tr.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockTransferProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'ViaTransfer'
		join Merchandising.StockTransfer tr on tr.Id = tp.StockTransferId		
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- VIA SECOND TRANSFER RECEIVING LOCATION---------------
	(select
		convert(varchar(max), tr.Id) [TransactionId],
		tp.ProductId,
		t.ReceivingLocationId [LocationId],
		'Transfer' [Type],
		'Stock Transfer (Via) #' + convert(varchar(max), tr.Id) + ' - From {0} to {1} (' + ISNULL(tr.ReferenceNumber, 'No reference') + ')' Narration,
		isnull(t.Quantity,0) [Quantity],
		null [Date],
		tr.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tr.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockTransferProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'ViaTransfer'
		join Merchandising.StockTransfer tr on tr.Id = tp.StockTransferId		
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- REQUISITION SENDING LOCATION---------------
	(select
		convert(varchar(max), t.BookingId) [TransactionId],
		tp.ProductId,
		t.SendingLocationId [LocationId],
		'Requisition' [Type],
		'Stock Requisition - Booking #' + convert(varchar(max), t.BookingId) + ' - From {0} to {1}' Narration,
		isnull(0 - t.Quantity,0) [Quantity],
		null [Date],
		tp.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tp.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockRequisitionProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'Requisition'	
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- REQUISITION RECEIVING LOCATION---------------
	(select
		convert(varchar(max), t.BookingId) [TransactionId],
		tp.ProductId,
		t.ReceivingLocationId [LocationId],
		'Requisition' [Type],
		'Stock Requisition - Booking #' + convert(varchar(max), t.BookingId) + ' - From {0} to {1}' Narration,
		isnull(t.Quantity,0) [Quantity],
		null [Date],
		tp.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tp.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockRequisitionProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'Requisition'		
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- ALLOCATION SENDING LOCATION---------------
	(select
		convert(varchar(max), t.BookingId) [TransactionId],
		tp.ProductId,
		t.SendingLocationId [LocationId],
		'Allocation' [Type],
		'Stock Allocation - Booking #' + convert(varchar(max), t.BookingId) + ' - From {0} to {1}' Narration,
		isnull(0 - t.Quantity,0) [Quantity],
		null [Date],
		tp.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tp.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockAllocationProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'Allocation'		
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- ALLOCATION RECEIVING LOCATION---------------
	(select
		convert(varchar(max), t.BookingId) [TransactionId],
		tp.ProductId,
		t.ReceivingLocationId [LocationId],
		'Allocation' [Type],
		'Stock Allocation - Booking #' + convert(varchar(max), t.BookingId) + ' - From {0} to {1}' Narration,
		isnull(t.Quantity,0) [Quantity],
		null [Date],
		tp.CreatedDate [DateUTC],
		t.DateProcessed [DateProcessedUTC],
		tp.CreatedById [UserId],
		null [IsDirect], 
		t.SendingLocationId,
		t.ReceivingLocationId
	from
		Merchandising.StockTransferMovement t
		join Merchandising.StockAllocationProduct tp on t.Bookingid = tp.BookingId and t.[Type] = 'Allocation'		
		join Merchandising.Product p on tp.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- ADJUSTMENT ---------------
	(select
		convert(varchar(max), a.Id) [TransactionId],
		r.ProductId,
		a.LocationId,
		'Adjustment' [Type],
		case when c.id > 0 
			then 'Adjustment #'+ convert(varchar(max), a.id)+ ' - Stock Count #' + convert(varchar(max), c.id)
			else 'Adjustment #'+ convert(varchar(max), a.id) + ' - ' + rsn.SecondaryReason + ' (' + ISNULL(a.ReferenceNumber, 'No reference')+')'
		end  Narration,
		r.Quantity,
		a.CreatedDate [Date],
		null [DateUTC],
		a.CreatedDate [DateProcessedUTC],
		a.CreatedById [UserId],
		null [IsDirect], 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	from
		Merchandising.StockAdjustment a
		join Merchandising.StockAdjustmentProduct r on r.StockAdjustmentId = a.Id
		left join Merchandising.StockAdjustmentSecondaryReason rsn on a.SecondaryReasonId = rsn.Id
		left join Merchandising.StockCount c on c.StockAdjustmentId = a.Id
		join Merchandising.Product p on r.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- GOODS RECEIPT ---------------
	(select
		convert(varchar(max), x.Id) [TransactionId],
		o.ProductId,
		x.LocationId,
		'GoodsReceipt' [Type],
		'Goods Receipt #'+ convert(varchar(max),x.id) + ' Delivery/Invoice: ' + COALESCE(x.VendorDeliveryNumber, x.VendorInvoiceNumber, 'No reference')+' - Purchase Order: ' + cast(o.PurchaseOrderId as varchar(20)) Narration,
		sum(y.QuantityReceived) [Quantity],
		x.DateReceived [Date],
		null [DateUTC],
		x.CreatedDate [DateProcessedUTC],
		x.CreatedById [UserId],
		cast(0 as bit) [IsDirect], 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	from
		Merchandising.GoodsReceipt x
		join Merchandising.GoodsReceiptProduct y on y.GoodsReceiptId = x.Id and x.CostConfirmed is not null
		join Merchandising.PurchaseOrderProduct o on y.PurchaseOrderProductId = o.Id
		join Merchandising.PurchaseOrder z on o.PurchaseOrderId = z.Id
		join Merchandising.Product p on o.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
	group by
		 x.id
		,x.LocationId
		,x.DateReceived
		,x.CreatedDate
		,x.CreatedById
		,o.ProductId
		,o.PurchaseOrderId
		,x.VendorDeliveryNumber
		,x.VendorInvoiceNumber
    having sum(y.QuantityReceived) != 0
	)
union all
--------- GOODS RECEIPT (DIRECT)---------------
	(select
		convert(varchar(max), x.Id) [TransactionId],
		y.ProductId,
		x.LocationId,
		'DirectGoodsReceipt' [Type],
		'Direct Goods Receipt #' + convert(varchar(max), x.Id)+ ' Delivery/Invoice: ' + COALESCE(x.VendorDeliveryNumber, x.VendorInvoiceNumber, 'No reference') Narration,
		y.QuantityReceived [Quantity],
		x.DateReceived [Date],
		null [DateUTC],
		x.CreatedDate [DateProcessedUTC],
		x.CreatedById [UserId],
		cast(1 as bit) [IsDirect], 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	from
		Merchandising.GoodsReceiptDirect x
		join Merchandising.GoodsReceiptDirectProduct y on y.GoodsReceiptDirectId = x.Id
		join Merchandising.Product p on y.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- VENDOR RETURN ---------------
	(select
		convert(varchar(max), x.Id) [TransactionId],
		o.ProductId,
		g.LocationId,
		'VendorReturn' [Type],
		'Return to Vendor #' + convert(varchar(max), x.Id) + ' (' + ISNULL(x.ReferenceNumber, 'No reference')+') - Goods Receipt: #' + convert(varchar(max),r.GoodsReceiptId) Narration,
		y.QuantityReturned * -1 [Quantity],
		null [Date],
		x.CreatedDate DateUTC,
		x.CreatedDate [DateProcessedUTC],
		x.CreatedById [UserId],
		cast(0 as bit) [IsDirect], 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	from
		Merchandising.VendorReturn x
		join Merchandising.VendorReturnProduct y on y.VendorReturnId = x.Id and x.ReceiptType != 'Direct'
		join Merchandising.GoodsReceipt g on g.Id = x.GoodsReceiptId
		join Merchandising.GoodsReceiptProduct r on y.GoodsReceiptProductId = r.Id
		join Merchandising.PurchaseOrderProduct o on r.PurchaseOrderProductId = o.Id
		join Merchandising.Product p on o.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
    WHERE y.QuantityReturned != 0
		)
union all
--------- VENDOR RETURN (DIRECT)---------------
	(select
		convert(varchar(max), x.Id) [TransactionId],
		r.ProductId,
		d.LocationId,
		'VendorReturn' [Type],
		'Return to Vendor #' + convert(varchar(max),x.id) + ' (' + ISNULL(x.ReferenceNumber, 'No reference')+') -  Goods Receipt: #' + convert(varchar(max), d.Id)  Narration,
		y.QuantityReturned * -1 [Quantity],
		null [Date],
		x.CreatedDate DateUTC,
		x.CreatedDate [DateProcessedUTC],
		x.CreatedById [UserId],
		cast(1 as bit) [IsDirect], 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	from 
		Merchandising.VendorReturn x
		join Merchandising.VendorReturnProduct y on y.VendorReturnId = x.Id and x.ReceiptType = 'Direct'
		join Merchandising.GoodsReceiptDirectProduct r on y.GoodsReceiptProductId = r.Id
		join Merchandising.GoodsReceiptDirect d on r.GoodsReceiptDirectId = d.Id
		join Merchandising.Product p on r.ProductId = p.Id and p.ProductType in ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
		)
union all
--------- CINT ORDER ---------------
(
	SELECT
		x.PrimaryReference + '-' + x.ReferenceType + ':' + x.SecondaryReference AS TransactionId,
		p.Id AS ProductId,
		l.Id AS LocationId,
		'Sale' AS [Type],
		x.[Type] + ' - Account ' + x.PrimaryReference + ' ' + x.ReferenceType + ': ' + x.SecondaryReference AS Narration,
		x.Quantity * -1 AS Quantity,
		NULL AS [Date],
		ISNULL(co.TransactionDate, x.TransactionDate) AS DateUTC,
		x.TransactionDate AS DateProcessedUTC,
		NULL AS UserId,
		NULL AS IsDirect, 
		NULL AS SendingLocationId,
		NULL AS ReceivingLocationId
	FROM Merchandising.CintOrder x
	INNER JOIN Merchandising.Product p 
		ON x.[Type] not IN ('RegularOrder', 'CancelOrder') 
		AND p.Sku = x.Sku 
		AND p.ProductType IN ('RegularStock', 'RepossessedStock', 'SparePart','ProductWithoutStock')
			and (p.PreviousProductType='RegularStock' or p.PreviousProductType is null) 
	INNER JOIN Merchandising.Location l 
		ON RIGHT(l.SalesId, 3) = x.StockLocation
	LEFT JOIN Merchandising.CintOrder co
		ON co.Id = x.CintRegularOrderId
)
) x
INNER JOIN Merchandising.Product p 
	ON x.ProductId = p.id
LEFT JOIN Merchandising.ProductHierarchySummaryView ph 
	ON ph.ProductId = p.Id
LEFT JOIN Merchandising.Brand b 
	ON p.BrandId = b.Id
LEFT JOIN [Admin].[User] u 
	ON x.UserId = u.id
INNER JOIN Merchandising.Location l 
	ON x.LocationId = l.Id
	AND 
	(
		NULLIF(NULLIF(p.storetypes, ''), '[]') IS NULL 
		OR p.storetypes LIKE '%"' + l.storetype + '"%'
	)





