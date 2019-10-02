IF OBJECT_ID('Stock.StockItemView') IS NOT NULL
	DROP VIEW Stock.[StockItemView]
GO

CREATE VIEW Stock.[StockItemView]
AS

SELECT
    ROW_NUMBER() OVER(ORDER BY i.ID, b.branchno, i.category) AS Id,
    ISNULL(ph.DivisionCode, '') AS DepartmentCode, --Division
    ISNULL(ph.DivisionName, '') AS Department,--Division
    b.branchno AS origbr,  
    b.StoreType,
    i.itemno,  
    i.suppliercode,
    i.itemdescr1,  
    i.itemdescr2, 
    i.unitpricehp, 
    i.unitpricecash,  
    i.taxrate * 100 AS taxRate,
    Convert(smallint, ISNULL(i.category, 0)) AS category, 
    ISNULL(ph.DepartmentName, '') AS CategoryName, --Department
    i.supplier,
    i.prodstatus,
    i.warrantable,
    i.ProdType AS itemtype,
    i.DutyFreePrice AS unitpricedutyfree,
    i.refcode,
    i.warrantyrenewalflag,
    i.assemblyrequired,
    i.CostPrice,
    i.Supplier AS suppliername,
    p.CreatedDate AS DateActivated,
    s.IUPC,
    s.ColourName,
    s.ColourCode,
    s.VendorStyle,
    s.VendorLongStyle,
    s.ID AS ItemID,
    s.SKU,
    i.barcode AS VendorEAN,
    s.RepossessedItem,
    s.VendorWarranty,
    s.SparePart,
    ISNULL(i.Class, '') AS Class, 
    ISNULL(ph.ClassName, '') AS ClassName,
    i.SubClass,
    brand.brandName AS Brand,
    s.ItemPOSDescr,
    CAST(ISNULL(pr.unitprice, 0) AS money) AS UnitPromoPrice
FROM Merchandising.ProductExportView i
inner join stockinfo s 
    ON i.itemno = s.itemno
INNER JOIN Branch b 
    ON b.branchno = i.warehouseno
INNER JOIN merchandising.Product p 
    ON p.Id = i.productId
LEFT JOIN dbo.promoprice pr 
    ON i.itemno = pr.itemno 
    AND i.warehouseno = pr.origbr 
    AND GETDATE() >= pr.fromdate 
    AND pr.todate > GETDATE()
LEFT JOIN merchandising.Brand brand 
    ON brand.Id = p.BrandId
INNER join merchandising.ProductHierarchySummaryView ph 
    ON i.ProductId = ph.productId 

GO