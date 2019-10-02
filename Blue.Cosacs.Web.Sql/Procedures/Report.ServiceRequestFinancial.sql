IF OBJECT_ID('Report.ServiceRequestFinancial') IS NOT NULL
	DROP PROCEDURE Report.ServiceRequestFinancial
GO

CREATE PROCEDURE Report.ServiceRequestFinancial
	@DateFrom			Date,
	@DateTo				Date,
	@ProductCategory	INT = NULL,
	@ChargeTo			VarChar(32) = NULL
AS

	SET NOCOUNT ON;

	DECLARE @ArithabortState Int = 64 & @@OPTIONS
	
	SET ARITHABORT ON;

	WITH XMLNAMESPACES(default 'http://www.bluebridgeltd.com/cosacs/2012/schema.xsd'),
	Data(ServiceRequestId, MessageId) AS
	(
		SELECT
			c.value('ServiceRequestNo[1]', 'int') AS ServiceRequestId,
			Requests.Id AS MessageId
		FROM  
			(
				SELECT m.Body, m.Id FROM hub.Message m WHERE m.Routing = 'Cosacs.Service.Detail'
			) AS Requests
			CROSS APPLY Requests.Body.nodes('/ServiceDetail') AS Request(c)
	)
	SELECT 
		r.Id AS [Service Request Number],
		r.ResolutionPrimaryCharge  AS [Charge To],
		sca.AcctNo AS [Charge To Account],
		CONVERT(CHAR(10), r.ResolutionDate, 103) AS [Date Resolved], 
		r.ItemNumber AS [Product Code],
		s.Name AS [Product Category],
		t.RunNo AS [Interface Run Number],
		CONVERT(CHAR(10), i.DateStart, 103) AS [Interface Transaction Date],
		t.Account,
		t.Type AS [Transaction Type Code],
		t.Amount
	FROM
		Data d
		INNER JOIN Financial.[Transaction] t
			ON t.MessageId = d.MessageId
		INNER JOIN service.Request r
			on d.ServiceRequestId = r.Id 
		LEFT JOIN
		(
			SELECT h.ProductId, h.HierarchyTagId, t.Name, p.SKU
			FROM 
				Merchandising.ProductHierarchy h 
				INNER JOIN Merchandising.HierarchyTag t 
					ON t.Id = h.HierarchyTagId
				INNER JOIN Merchandising.Product p
					ON h.ProductId = p.Id
			WHERE h.HierarchyLevelId = 2
		) s
			ON r.ItemNumber = s.SKU
		INNER JOIN InterfaceControl i
			ON t.RunNo = i.RunNo
			AND i.Interface = 'FIN.TRAN'
		LEFT JOIN ServiceChargeAcct sca
			ON sca.ServiceRequestNo = r.Id
	WHERE
		CONVERT(DATE, i.DateStart) BETWEEN @DateFrom AND @DateTo
		AND COALESCE(s.HierarchyTagId, 0) = COALESCE(@ProductCategory, s.HierarchyTagId, 0)
		AND COALESCE(r.ResolutionPrimaryCharge, '') = COALESCE(@ChargeTo, r.ResolutionPrimaryCharge, '')
	ORDER BY
		[Service Request Number]

	IF (@ArithabortState & 64) = 64
		SET ARITHABORT ON
	ELSE
		SET ARITHABORT OFF