IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ComboView]'))
DROP VIEW  [Merchandising].[ComboView]
GO

CREATE VIEW [Merchandising].[ComboView]
AS
SELECT
	p.Id,
	p.SKU,
	p.LongDescription,
	p.[Status],
	c.StartDate,
	c.EndDate,
	p.LastUpdatedDate,
	p.PriceTicket,
	p.CreatedDate,
	p.Tags
FROM
	[Merchandising].[Combo] c
	JOIN
	[Merchandising].[Product] p ON p.Id = c.Id
GO