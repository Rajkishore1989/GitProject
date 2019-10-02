IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PromotionDetailView]'))
DROP VIEW  [Merchandising].[PromotionDetailView]
GO

CREATE VIEW [Merchandising].[PromotionDetailView]
AS
select pd.Id, pd.PromotionId, pd.ProductId, pd.priceType, p.[StartDate],p.EndDate, p.LocationId, p.Fascia
from Merchandising.PromotionDetail pd
join Merchandising.Promotion p
on pd.promotionid = p.id

GO

