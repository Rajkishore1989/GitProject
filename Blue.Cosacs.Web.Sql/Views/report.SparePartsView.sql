IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[report].[SparePartsView]'))
DROP VIEW [report].[SparePartsView]
GO

CREATE VIEW [report].[SparePartsView]
AS
	SELECT 
		CASE	
			WHEN r.Type IN ('IE', 'II') THEN 'Installation'
			ELSE 'Service Request'
		END AS [Source],	
		CASE 
			WHEN r.Type IN ('IE', 'II', 'SE', 'SI') THEN r.ResolutionDate 
			ELSE r.ItemDeliveredOn 
		END AS [DateDelivered],	
		CASE 
			WHEN r.Type IN ('IE', 'II', 'SE', 'SI') THEN CONVERT(Date, r.ResolutionDate) 
			else CONVERT(Date, r.ItemDeliveredOn) 
		END AS ItemDeliveredOn,
		r.ResolutionDate AS [TransactionDate],
		r.Account AS [AccountNumber],
		r.Id AS [ServiceRequestNumber],
		p.PartNumber AS [PartProductCode],
		p.Quantity,
		p.CostPrice AS [UnitPrice],
		p.Quantity * p.CostPrice AS CostPrice,
		p.StockBranch AS Branch,
		NULL AS [WarehouseBookingId],
		NULL AS [PurchaseBranch],
		NULL AS [AgreementNumber],
		p.Source AS PartsSource
	FROM
		[Service].[Request] r
		INNER JOIN service.RequestPart p
			ON p.RequestId = r.id
		LEFT JOIN StockInfo SI
			ON p.PartNumber = SI.itemno
			AND SI.category = 20
	WHERE 
		r.Type IN ('IE', 'II', 'S', 'SE', 'SI')
	UNION ALL
	SELECT 
		'Sales Order' AS [Source],
		d.datedel AS [DateDelivered],
		CONVERT(Date, d.datedel) AS datedel,
		AC.dateacctopen AS [TransactionDate],
		d.acctno AS [AccountNumber],
		NULL AS [RequestNumber],
		si.IUPC AS [PartProductCode],
		d.quantity,
		sp.CostPrice AS [UnitPrice],
		d.quantity * sp.CostPrice AS CostPrice,
		d.stocklocn AS Branch,
		wb.Id AS [WarehouseBookingId],
		l.SalesBrnNo [PurchaseBranch],
		d.agrmtno AS [AgreementNumber], 
		NULL AS PartsSource
	FROM
		delivery d
		INNER JOIN StockInfo si
			ON d.ItemID = si.Id
		INNER JOIN StockPrice sp on si.Id = sp.ID
		and d.stocklocn = sp.branchno
		left outer JOIN Warehouse.Booking wb on wb.AcctNo = d.acctno
		and wb.ItemId = d.ItemID
		and wb.StockBranch = d.stocklocn
		INNER JOIN Lineitem l on d.acctno = l.acctno
		and d.agrmtno=l.agrmtno
		and d.ItemID = l.ItemID
		and d.stocklocn = l.stocklocn
		INNER JOIN Acct AC
			ON d.acctno = AC.acctno
	WHERE
		si.category = 20

GO


