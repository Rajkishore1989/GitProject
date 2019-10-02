IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[PrintLabelView]'))
DROP VIEW  Merchandising.PrintLabelView
Go

CREATE VIEW [Merchandising].[PrintLabelView]
AS
SELECT ISNULL(CONVERT(int, ROW_NUMBER() OVER(ORDER BY p.Id)),0) as Id
, pop.Id as PurchaseOrderProductId 
, p.Id as ProductId
, ProductType
, p.SKU
, LongDescription
, VendorUPC
, BoxCount
, POSDescription
, p.VendorStyleLong
, b.BrandName
, po.Vendor
, po.Id as PurchaseOrderId
from Merchandising.PurchaseOrderProduct pop
join merchandising.purchaseorder po
on pop.PurchaseOrderId = po.id
join merchandising.product p
on pop.productid = p.id
left outer join Merchandising.Brand b 
on p.BrandId = b.id

go
