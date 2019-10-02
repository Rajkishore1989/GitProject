IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].SummaryUpdateControlReportView'))
	DROP VIEW [Merchandising].SummaryUpdateControlReportView
GO

CREATE VIEW [Merchandising].SummaryUpdateControlReportView
AS

SELECT
	row_number() over( order by [TransactionDate] ) id,
	x.*
FROM (
	SELECT
		p.SKU,
		'Goods Receipt' [TransactionType],
		t.[Description] [Reference],
		t.[Date] [TransactionDate],
		pm.Units,
		pm.Cost [Value],
		m.LocationId,
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		pm.Id [ProductMessageId]
	FROM Financial.[Transaction] t
	INNER JOIN Financial.GoodsReceiptMessage m 
		ON m.MessageId = t.MessageId
	INNER JOIN Financial.GoodsReceiptProductMessage pm 
		ON pm.GoodsReceiptMessageId = m.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = pm.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.Id = m.LocationId

	UNION

	SELECT
		p.SKU,
		'Goods Receipt' [TransactionType],
		t.[Description] [Reference],
		t.[Date] [TransactionDate],
		pm.Units * -1,
		pm.Cost * -1 [Value],
		m.LocationId,
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		pm.Id [ProductMessageId]
	FROM Financial.[Transaction] t
	INNER JOIN Financial.VendorReturnMessage m 
		ON m.MessageId = t.MessageId
	INNER JOIN Financial.VendorReturnProductMessage pm 
		ON pm.VendorReturnMessageId = m.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = pm.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.Id = m.LocationId

	UNION
	
	SELECT 
		p.SKU,
		'Stock Transfer' [TransactionType],
		t.[Description] [Reference],
		t.[Date] [TransactionDate],
		pm.Units * -1 [Units],
		pm.Cost * -1 [Value] ,
		m.LocationId,
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		pm.Id [ProductMessageId]
	FROM Financial.[Transaction] t
	INNER JOIN Financial.TransferMessage m 
		ON m.MessageId = t.MessageId
	INNER JOIN Financial.TransferProductMessage pm 
		ON pm.TransferMessageId = m.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = pm.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.Id = m.LocationId
	
	UNION

	SELECT
		p.SKU,
		'Stock Transfer' [TransactionType],
		t.[Description] [Reference],
		t.[Date] [TransactionDate],
		pm.Units,
		pm.Cost [Value],
		m.ReceivingLocationId [LocationId],
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		pm.Id [ProductMessageId]
	FROM Financial.[Transaction] t
	INNER JOIN Financial.TransferMessage m 
		ON m.MessageId = t.MessageId
	INNER JOIN Financial.TransferProductMessage pm 
		ON pm.TransferMessageId = m.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = pm.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.Id = m.ReceivingLocationId
	
	UNION 

	SELECT
		p.SKU,
		CASE 
			WHEN sc.Id IS NULL THEN 'Adjustment ' + 
				CASE 
					WHEN pm.Units > 0 THEN 'Gains' 
					ELSE 'Losses' 
				END 
			ELSE 'Inventory Count Adjustments' 
		END [TransactionType],
		t.[Description] [Reference],
		t.[Date] [TransactionDate],
		pm.Units,
		pm.Cost [Value],
		m.LocationId,
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		pm.Id [ProductMessageId]
	FROM Financial.[Transaction] t
	INNER JOIN Financial.StockAdjustmentMessage m 
		ON m.MessageId = t.MessageId
	INNER JOIN Financial.StockAdjustmentProductMessage pm 
		ON pm.StockAdjustmentMessageId = m.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = pm.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.Id = m.LocationId
	LEFT JOIN Merchandising.StockCount sc 
		ON sc.StockAdjustmentId = m.AdjustmentId
	
	UNION 

	SELECT
		p.SKU,
		'Deliveries' [TransactionType],
		o.PrimaryReference + ': ' + o.ReferenceType + ' ' + o.SecondaryReference [Reference],
		CONVERT(DATE, DATEADD(second, DATEDIFF(second, GETUTCDATE(), GETDATE()), o.TransactionDate)) AS TransactionDate,
		o.Quantity * -1 [Units],
		-(m.TotalAWC) [Value],
		l.Id [LocationId],
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		o.Id [ProductMessageId]
	FROM Financial.CintOrderReceiptMessage m 
	INNER JOIN Merchandising.CintOrder o 
		ON m.CintOrderId = o.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = m.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.SalesId = o.StockLocation
	OUTER APPLY 
	(
		SELECT MAX(RunNo) AS RunNo 
		FROM Financial.[Transaction] 
		WHERE MessageId = m.MessageId
	) t
	WHERE o.[Type] in ('Delivery', 'Redelivery')

	UNION

	SELECT
		p.SKU,
		'Collects' [TransactionType],
		o.PrimaryReference + ': ' + o.ReferenceType + ' ' + o.SecondaryReference [Reference],
		CONVERT(DATE, DATEADD(second, DATEDIFF(second, GETUTCDATE(), GETDATE()), o.TransactionDate)) AS TransactionDate,
		ABS(o.Quantity) [Units],
		ABS(m.TotalAWC) [Value],
		l.Id [LocationId],
		l.SalesId,
		l.Name [Location],
		t.RunNo [RunNumber],
		p.ProductType,
		o.Id [ProductMessageId]
	FROM Financial.CintOrderReceiptMessage m 
	INNER JOIN Merchandising.CintOrder o 
		ON m.CintOrderId = o.Id
	INNER JOIN Merchandising.Product p 
		ON p.Id = m.ProductId
	INNER JOIN Merchandising.Location l 
		ON l.SalesId = o.StockLocation
	OUTER APPLY 
	(
		SELECT MAX(RunNo) AS RunNo 
		FROM Financial.[Transaction] 
		WHERE MessageId = m.MessageId
	) t
	WHERE o.[Type] in ('Return', 'Repossession')
) x
