
IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[OrderExportView]'))
DROP VIEW  [Merchandising].[OrderExportView]
GO

CREATE VIEW [Merchandising].[OrderExportView]
AS

select poproduct.Id, SalesId as WarehouseNo, SKU as ItemNo, Vendor.Code as Supplier
, PO.Id as OrderNo, EstimatedDeliveryDate as DeliveryDate
, ISNULL(quantity.quantitypending,poproduct.QuantityOrdered) as OrderQuantity  
from merchandising.purchaseorder po
inner join Merchandising.PurchaseOrderProduct poproduct on poproduct.PurchaseOrderId = po.Id
Left Outer Join Merchandising.PurchaseOrderProductStatsView as quantity on quantity.Id = poproduct.Id
inner join merchandising.Location Location on po.ReceivingLocationId = Location.Id
inner join merchandising.Supplier vendor on po.VendorId = Vendor.Id
WHERE ISNULL(quantity.quantitypending,poproduct.QuantityOrdered) > 0
	and po.status not in ('Completed', 'Cancelled')
GO

