IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianPaymentsTotCostView]'))
DROP VIEW service.TechnicianPaymentsTotCostView
Go

CREATE VIEW Service.TechnicianPaymentsTotCostView 
AS

WITH Costs AS
(
	SELECT r.Id as RequestId, c.Cost
	FROM Service.Request r
	INNER JOIN Service.Charge c ON r.Id = c.RequestId AND (c.Label IN ('Labour', 'Additional', 'Labour and Additional'))
	UNION
	SELECT r.Id as RequestId, rp.CostPrice as Cost
	FROM Service.Request r
	INNER JOIN Service.RequestPart rp on r.Id = rp.RequestId AND rp.[Source] = 'External'
)

SELECT  tb.UserId AS TechnicianId, u.FullName, ISNULL(SUM(c.Cost), 0) AS Total
FROM Service.Request r
INNER JOIN Service.TechnicianBooking tb ON r.id = tb.RequestId
INNER JOIN Service.Technician t on tb.UserId = t.UserId
INNER JOIN Costs c ON r.Id = c.RequestId
INNER JOIN Admin.[User] u ON u.Id = tb.UserId
WHERE 
	t.Internal = 0
	AND IsNull(r.TechnicianPayState, 'H') = 'H'
	AND r.State = 'Closed'
GROUP BY tb.UserId, u.FullName
