IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ForcePromotionIndexView]'))
DROP VIEW  [Merchandising].[ForcePromotionIndexView]
GO

CREATE VIEW Merchandising.ForcePromotionIndexView
AS
SELECT detail.Id, promo.id as PromotionId, Promo.Name, StartDate, EndDate, PromotionType, location.Name as LocationName, promo.Fascia
, hierarchy.Hierarchy
,product.id as ProductId
,product.Sku
,product.LongDescription
FROM Merchandising.Promotion promo
INNER JOIN Merchandising.PromotionDetail detail on promo.id = detail.PromotionId
LEFT OUTER JOIN  Merchandising.Location location on promo.LocationId = location.Id
LEFT OUTER JOIN Merchandising.PromotionalHierarchyConcatView hierarchy on hierarchy.PromotionDetailId = detail.Id
LEFT OUTER JOIN Merchandising.Product product on product.id = detail.ProductId
GO
