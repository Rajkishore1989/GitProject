IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[TechnicianPaymentsView]'))
DROP VIEW service.TechnicianPaymentsView
Go

CREATE VIEW Service.TechnicianPaymentsView 
AS

WITH Costs AS
(
	SELECT r.Id as RequestId, c.Cost, NULL as CostPrice
	FROM Service.Request r
	INNER JOIN Service.Charge c ON r.Id = c.RequestId AND (c.Label IN ('Labour', 'Additional', 'Labour and Additional'))
	UNION
	SELECT r.Id as RequestId, NULL as Cost, rp.CostPrice
	FROM Service.Request r
	INNER JOIN Service.RequestPart rp on r.Id = rp.RequestId AND rp.[Source] = 'External'
)

SELECT
	r.Id AS RequestId,
	tb.UserId AS TechnicianId,
	u.FullName,
	tb.AllocatedOn,
    ISNULL(SUM(c.Cost), 0) AS Labour,
	ISNULL(SUM(c.CostPrice), 0) AS PartsOther,
	ISNULL(ISNULL(SUM(c.Cost), 0) + ISNULL(SUM(c.CostPrice),0), 0) AS Total,
	r.TechnicianPayState AS State
FROM 
	Service.Request r
	INNER JOIN
		Service.TechnicianBooking tb ON r.id = tb.RequestId
	INNER JOIN
		Costs c ON r.Id = c.RequestId
	INNER JOIN 
		Admin.[User] u ON tb.UserId = u.Id
WHERE
	r.State = 'Closed'
GROUP BY 
	r.Id,  
	tb.UserId, 
	r.TechnicianPayState, 
	tb.AllocatedOn, 
	u.FullName