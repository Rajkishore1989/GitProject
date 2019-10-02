IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[RP3ProductExportView]'))
	DROP VIEW [Merchandising].[RP3ProductExportView]
GO

CREATE VIEW [Merchandising].[RP3ProductExportView]
AS

WITH tax(EffectiveDate, ProductId, Rate, RowId)  
AS  
(  
 SELECT distinct t.EffectiveDate, t.ProductId, t.Rate, ROW_NUMBER() OVER (PARTITION BY ProductId ORDER BY EffectiveDate DESC) RowID 
 FROM Merchandising.TaxRate t  
 WHERE t.EffectiveDate <= GETDATE()  
)
SELECT
	p.Id,
	p.ProductAction,
	ISNULL(u.FirstName + ' ' + u.LastName, 'EBS') as [User],
	p.ExternalCreationDate, 
	p.CreatedDate as CreationDate,
	p.SKUStatus as SkuStatusCode,
	s.Type as SkuType,
	p.SKU as ProductCode,
	p.CorporateUPC,
	ph.DivisionCode as DivisionCode,
	ph.DivisionName as DivisionName,
	ph.DepartmentCode as DepartmentCode,
	ph.DepartmentName as DepartmentName,
	ph.ClassCode as ClassCode,
	ph.ClassName as ClassName,
	s.Code as VendorCode,
	s.Name as VendorName,
	b.BrandCode as BrandCode,
	b.BrandName as BrandName,
	p.VendorStyleLong as SupplierModel,
	p.LongDescription as [Description],
	cp.SupplierCurrency as CurrencyType,
	cp.AverageWeightedCost as AverageCost,
	cp.LastLandedCost as LastReceptionCost,
	cp.SupplierCost as LastSupplierCost,
	landedCost.MinimumLandedCost as LowestReceptionCost,
	cashPrice.MaxmimumCashPrice as RetailPrice,
	MAX(stockMovement.[Date]) as LastTransactionDate,
	MAX(goodsReceipt.[Date]) as LastReceptionDate,
	MAX(cintOrder.Date) as LastSalesDate,
	ps.Name as ProductStatus,
	p.Tags,
	CASE 
		WHEN p.ProductType = 'ProductWithoutStock' THEN 'WithoutStock'
		ELSE p.ProductType
	END as ProductType,
	p.ReplacingTo,
	p.VendorWarranty,
	p.CountryOfOrigin,
	i.name as Incoterm,
	i.CountryOfDispatch,
	i.LeadTime,
	p.Attributes,
	CASE
		WHEN COALESCE(tId.Rate, t.Rate, 0) <= 0 THEN 'N'
		ELSE 'Y'
	END as SubjectTax,
	COALESCE(tId.Rate, t.Rate, 0) as TaxPercentage
FROM Merchandising.Product p
INNER JOIN Merchandising.Supplier s
	ON p.PrimaryVendorId = s.Id
INNER JOIN Merchandising.Brand b
	ON p.BrandId = b.id
INNER JOIN Merchandising.ProductStatus ps
	ON p.Status = ps.Id
LEFT JOIN Merchandising.ProductHierarchySummaryView ph
	ON ph.ProductId = p.Id
LEFT JOIN merchandising.CurrentCostPriceView cp
	ON cp.ProductId = p.Id
LEFT JOIN (
	SELECT
		MIN(LastLandedCost) as MinimumLandedCost,
		ProductId
	FROM Merchandising.CostPriceView
	GROUP BY ProductId
) landedCost
	ON p.id = landedCost.ProductId
LEFT JOIN (
	SELECT
		MAX(CashPrice) as MaxmimumCashPrice,
		ProductId
	FROM Merchandising.CurrentRetailPriceView
	GROUP BY ProductId
) cashPrice
	ON p.id = cashPrice.ProductId
LEFT JOIN (
	SELECT
		MAX(Date) as [Date],
		ProductId
	FROM Merchandising.StockMovementReportView
	GROUP BY ProductId
) stockMovement
	ON p.id = stockMovement.ProductId
LEFT JOIN (
	SELECT
		MAX(DateReceived) as [Date],
		ProductId
	FROM Merchandising.GoodsReceiptProductView
	GROUP BY ProductId
) goodsReceipt
	ON p.id = goodsReceipt.ProductId
LEFT JOIN (
	SELECT
		MAX(TransactionDate) as [Date],
		ProductId
	FROM Merchandising.CintOrder
	GROUP BY ProductId
) cintOrder
	ON p.id = cintOrder.ProductId
 LEFT JOIN tax AS tId ON tId.ProductId = p.Id AND tId.rowid = 1
 LEFT JOIN tax AS t ON t.ProductId IS NULL AND t.rowid = 1
LEFT JOIN (
	SELECT ROW_NUMBER() OVER(PARTITION BY ProductId ORDER BY SupplierUnitCost) as rowNum, *
	FROM merchandising.incoterm
) i
	ON i.productId = p.id
	AND i.rowNum = 1
LEFT JOIN admin.[User] u
	ON p.CreatedById = u.Id
LEFT JOIN Merchandising.ProductStockLevel psl
	ON psl.ProductId = p.Id
WHERE p.ProductType IN ('ProductWithoutStock', 'RegularStock')
	AND ps.Name != 'Non Active'
GROUP BY
	p.Id, p.ProductAction,
	ISNULL(u.FirstName + ' ' + u.LastName, 'EBS'),
	p.ExternalCreationDate, 
	p.CreatedDate,
	p.SKUStatus, s.Type, p.SKU, p.CorporateUPC,
	ph.DivisionCode, ph.DivisionName, ph.DepartmentCode, ph.DepartmentName, ph.ClassCode, ph.ClassName,
	s.Code,	s.Name,
	b.BrandCode, b.BrandName,
	p.VendorStyleLong, p.LongDescription,
	cp.SupplierCurrency, cp.AverageWeightedCost, cp.LastLandedCost, cp.SupplierCost, landedCost.MinimumLandedCost, cashPrice.MaxmimumCashPrice,
	ps.Name,
	p.Tags, p.ProductType, p.ReplacingTo, p.VendorWarranty, p.CountryOfOrigin,
	i.name, i.CountryOfDispatch, i.LeadTime, Attributes,
	COALESCE(tId.Rate, t.Rate, 0)
HAVING (SUM(ISNULL(psl.StockOnHand, 0)) > 0 AND ps.Name = 'Deleted') 
	OR ps.Name != 'Deleted'
