IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[SetLocationView]'))
DROP VIEW  [Merchandising].[SetLocationView]
GO

CREATE VIEW [Merchandising].[SetLocationView] 
AS
SELECT	
	sl.Id,
	sl.SetId,	
	sl.LocationId,
	sl.Fascia,
	l.Name,	
	sl.EffectiveDate,
	sl.RegularPrice,
	sl.CashPrice,
	sl.DutyFreePrice
FROM
	[Merchandising].[SetLocation] sl
	LEFT JOIN
	[Merchandising].[Location] l ON l.Id = sl.LocationId	
GO