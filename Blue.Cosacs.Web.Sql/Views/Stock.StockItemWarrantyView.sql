IF OBJECT_ID('Stock.StockItemWarrantyView') IS NOT NULL
	DROP VIEW Stock.StockItemWarrantyView
GO 

CREATE VIEW Stock.StockItemWarrantyView
AS
	
    with RefCodes(ProductId, Locationid, RefCode) AS
    (
	    SELECT 
		    p.Id AS ProductId, l.Id AS LocationId, sp.Refcode
	    FROM 
		    stockitem sp
		    INNER JOIN Merchandising.Product p
			    ON sp.itemno = p.SKU
		    INNER JOIN Merchandising.Location l
			    ON sp.stocklocn = l.SalesId
	    WHERE sp.deleted = 'n'
    )

	SELECT
        NEWID() AS id,
		i.itemno,  
		isnull(div.Tag, '') as Department,
        div.TagId as DepartmentId,
		Convert(smallint, isnull(i.category, 0)) as category, 
		isnull(dep.Tag, '') as CategoryName,
        dep.TagId as CategoryId,
		isnull(i.Class, '') as Class, 
		isnull(cl.Tag, '') as ClassName, 
        cl.TagId as ClassId,
		b.branchno AS origbr,  
		i.itemdescr1
		,i.Refcode
		,i.ProductId, 
        i.Locationid,
        p.ProductType
	FROM 
		(
			select distinct
                product.Id,
                product.ProductType,
				classMapping.LegacyCode as Category,
				product.SKU as ItemNo, 
				LEFT(product.POSDescription, 30) as ItemDescr1,
				l.SalesId as WarehouseNo,
				product.Id as ProductId,
				classTag.Code as Class
				,rf.RefCode
				,rf.Locationid
			from 
				merchandising.product product
                INNER JOIN Merchandising.ProductStockLevel SL
                    on product.Id = SL.ProductId
                INNER JOIN Merchandising.Location l
                    ON SL.LocationId = l.Id
				LEFT JOIN RefCodes rf
					ON rf.ProductId = product.Id
					AND rf.Locationid = SL.LocationId
				INNER JOIN merchandising.CurrentCostPriceView cost 
					on cost.productid = product.id
				LEFT JOIN merchandising.ProductHierarchy hierarchy 
					on hierarchy.ProductId = product.id
				LEFT JOIN merchandising.HierarchyTag tag 
					on tag.LevelId = hierarchy.HierarchyLevelId 
					and tag.id = hierarchy.HierarchyTagId
				INNER JOIN merchandising.ProductStatus prodstat 
					on prodstat.Id = product.[Status]
				LEFT join merchandising.ClassMapping classMapping 
					on classMapping.ClassCode = tag.Code
				LEFT JOIN merchandising.ProductHierarchy class 
					on class.HierarchyLevelId = 3 
					and class.ProductId = product.id
				LEFT JOIN MErchandising.HierarchyTag classTag 
					on classTag.Id = class.HierarchyTagId
			where 
				prodstat.Name != 'Non Active'
		) i
		INNER join stockinfo s 
			on i.itemno = s.itemno
		LEFT JOIN Branch b 
			on b.branchno = i.warehouseno
		LEFT JOIN merchandising.Product p 
			on p.Id = i.productId
		LEFT JOIN merchandising.Brand brand 
			on brand.Id = p.BrandId
		LEFT JOIN merchandising.producthierarchyView div 
			on i.ProductId = div.productId 
			and div.[Level] = 'Division'
		LEFT JOIN merchandising.producthierarchyView dep 
			on i.ProductId = dep.productId 
			and dep.[Level] = 'Department'
		LEFT JOIN merchandising.producthierarchyView cl 
			on i.ProductId = cl.productId 
			and cl.[Level] = 'Class'
