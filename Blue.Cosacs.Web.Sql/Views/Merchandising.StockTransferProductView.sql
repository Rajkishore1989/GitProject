IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[StockTransferProductView]'))
DROP VIEW  [Merchandising].[StockTransferProductView]
GO

create view [Merchandising].[StockTransferProductView] as
select 
        stp.*,
        p.Sku,
        p.LongDescription,
		b.BrandName [Brand],
		p.CorporateUPC,
		ht.Code [Category],
		p.VendorStyleLong [Model]
from
	Merchandising.Product p 
	join
	Merchandising.StockTransferProduct stp on stp.ProductId = p.Id
	join
	Merchandising.ProductHierarchy ph on ph.ProductId = p.Id
	left join
	Merchandising.HierarchyLevel hl on ph.HierarchyLevelId = hl.Id
	left join
	Merchandising.HierarchyTag ht on ht.LevelId = hl.Id and ph.HierarchyTagId = ht.Id
	left join
	Merchandising.Brand b on b.Id = p.BrandId
where
	hl.Name = 'Department'