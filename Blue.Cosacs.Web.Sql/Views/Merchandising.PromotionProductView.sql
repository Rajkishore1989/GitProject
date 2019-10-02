IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PromotionProductView]'))
DROP VIEW  [Merchandising].[PromotionProductView]
GO

CREATE VIEW Merchandising.PromotionProductView
AS
SELECT detail.Id, promo.id as PromotionId, Promo.Name, StartDate, EndDate, PromotionType,Location.Id as LocationId, Location.Name as LocationName,promo.Fascia, hierarchy.Hierarchy
,product.id as ProductId
,product.Sku
,product.LongDescription
,detail.PriceType
,detail.ValueDiscount
,detail.PercentDiscount
,detail.Price
FROM Merchandising.Promotion promo
INNER JOIN Merchandising.PromotionDetail detail on promo.id = detail.PromotionId
LEFT OUTER JOIN  Merchandising.Location location on promo.LocationId = location.Id
LEFT OUTER JOIN Merchandising.PromotionalHierarchyConcatView hierarchy on hierarchy.PromotionDetailId = detail.Id
LEFT OUTER JOIN Merchandising.Product product on product.id = detail.ProductId
GO
