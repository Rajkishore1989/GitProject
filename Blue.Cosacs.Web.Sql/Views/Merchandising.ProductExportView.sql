IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductExportView]'))
DROP VIEW [Merchandising].[ProductExportView]
GO

CREATE VIEW [Merchandising].[ProductExportView]
AS

SELECT
	price.Id,
	price.SalesId as WarehouseNo,
	product.Id as ProductId,
	product.SKU as ItemNo,
	LEFT(VendorStyleLong, 18) as SupplierCode,
	LEFT(product.POSDescription, 30) as ItemDescr1,
	CASE
		WHEN LEN(product.POSDescription) <= 30 THEN ''
		ELSE SUBSTRING(product.POSDescription, 31, 40)
	END as ItemDescr2,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(price.RegularPrice * (1 + price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(price.RegularPrice, 2))
	END as UnitPriceHP,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(price.CashPrice * (1 + price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(price.CashPrice, 2))
	END as UnitPriceCash,
	ISNULL(ph.LegacyCode, '') as Category,
	Vendor.Code as Supplier,
	CASE
		WHEN product.ProductType = 'Repossessed' THEN 'R'
		WHEN prodstat.Name = 'Discontinued' OR prodstat.Name = 'Deleted' THEN 'D'
		ELSE ''
	END as ProdStatus,
	CASE 
        WHEN product.Warrantable = 0 THEN 'N'
        ELSE 'Y'
    END AS Warrantable,
	'S' as ProdType,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.DutyFreePrice * (1 + Price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.DutyFreePrice, 2))
	END as DutyFreePrice,
	'' as RefCode,
	ISNULL(VendorUPC, '') as BarCode,
	'' as LeadTime, --TODO:LeadTime
	'N' as WarrantyRenewalFlag,
	'' as AssemblyRequired, --TODO:Assembly required
	CASE prodstat.Name
		WHEN 'Deleted' THEN 'Y'
		ELSE 'N'
	END as Deleted,
	ISNULL(cost.AverageWeightedCost, 0) as CostPrice,
	Vendor.Name as SupplierName,
	ph.ClassCode as Class,
	subclassTag.Code as SubClass,
	price.taxrate,
	Attributes,
	ProductType
FROM Merchandising.Product product
CROSS JOIN dbo.country c
INNER JOIN Merchandising.ExportPriceByLocationView price
	ON price.ProductId = product.Id
INNER JOIN Merchandising.CurrentCostPriceView cost
	ON cost.Productid = product.id
INNER JOIN Merchandising.ProductStatus prodstat
	ON prodstat.Id = product.[Status]
INNER JOIN Merchandising.Supplier vendor
	ON vendor.id = product.PrimaryVendorId
INNER JOIN Merchandising.ProductHierarchySummaryView ph
	ON ph.ProductId = product.id
LEFT JOIN Merchandising.ProductHierarchy subclass
	ON subclass.HierarchyLevelId = 4
	AND subclass.ProductId = product.id
LEFT JOIN Merchandising.HierarchyTag subClassTag
	ON subClassTag.Id = subClass.HierarchyTagId
WHERE productType NOT IN ('Set', 'Combo')
AND prodstat.Name != 'Non Active'
AND (Price.DutyFreePrice IS NOT NULL 
OR Price.CashPrice IS NOT NULL 
OR Price.RegularPrice IS NOT NULL)

UNION

SELECT
	price.Id,
	price.SalesId as WarehouseNo,
	product.Id as ProductId,
	product.SKU as ItemNo,
	VendorStyleLong as SupplierCode,
	LEFT(product.POSDescription, 30) as ItemDescr1,
	CASE
		WHEN LEN(product.POSDescription) <= 30 THEN ''
		ELSE SUBSTRING(product.POSDescription, 31, 45)
	END as ItemDescr2,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.RegularPrice * (1 + Price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.RegularPrice, 2))
	END as UnitPriceHP,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.CashPrice * (1 + Price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.CashPrice, 2))
	END as UnitPriceCash,
	'00' as Category,
	'' as Supplier,
	CASE prodstat.Name
		WHEN 'Discontinued' THEN 'D'
		WHEN 'Deleted' THEN 'D'
		ELSE 'L'
	END as ProdStatus,
    CASE 
        WHEN product.Warrantable = 0 THEN 'N'
        ELSE 'Y'
    END AS Warrantable,
	CASE product.ProductType
		WHEN 'ProductWithoutStock' THEN 'N'
		ELSE 'S'
	END as ProdType,
	CASE c.taxtype
		WHEN 'I' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.DutyFreePrice * (1 + Price.TaxRate), 2))
		WHEN 'E' THEN CONVERT(DECIMAL(15, 2), ROUND(Price.DutyFreePrice, 2))
	END as DutyFreePrice,
	'' as RefCode,
	ISNULL(VendorUPC, '') as BarCode,
	'' as LeadTime, --TODO:LeadTime
	'N' as WarrantyRenewalFlag,
	'' as AssemblyRequired, --IN CODE:Assembly required
	CASE prodstat.Name
		WHEN 'Deleted' THEN 'Y'
		ELSE 'N'
	END as Deleted,
	ISNULL(cost.AverageWeightedCost, 0) as CostPrice,
	'Unknown' as SupplierName,
	'' as Class,
	'' as SubClass,
	0 AS TaxRate,
	Attributes,
	ProductType
FROM Merchandising.Product product
CROSS JOIN dbo.country c
INNER JOIN Merchandising.ExportPriceByLocationView price
	ON price.ProductId = product.Id
LEFT JOIN Merchandising.CurrentCostPriceView cost
	ON cost.Productid = product.id
INNER JOIN Merchandising.ProductStatus prodstat
	ON prodstat.Id = product.[Status]
WHERE productType IN ('Set', 'Combo')
	AND prodstat.Name != 'Non Active'
AND (Price.DutyFreePrice IS NOT NULL 
OR Price.CashPrice IS NOT NULL 
OR Price.RegularPrice IS NOT NULL)
GO