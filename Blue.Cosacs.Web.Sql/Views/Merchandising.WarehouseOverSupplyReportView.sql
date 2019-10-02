IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[WarehouseOverSupplyReportView]'))
DROP VIEW  [Merchandising].[WarehouseOverSupplyReportView]
GO

create view [Merchandising].[WarehouseOverSupplyReportView]
as

with WarehouseStock (ProductId, WarehouseId, WarehouseName, StockOnHand)
as
( select p.Id, l.Id, l.Name, w.StockOnHand
from merchandising.product p
inner join Merchandising.ProductStockLevel w on w.productid = p.Id and stockonhand > 0
inner join merchandising.location l on l.id = w.LocationId and l.warehouse = 1
)

select CONVERT(INT, ROW_NUMBER() OVER (ORDER BY p.Id, l.Id DESC)) AS Id
, p.Id as ProductId, Sku, LongDescription, nullif(nullif(p.StoreTypes, '[]'), '') as StoreTypes, p.Tags
, w.WarehouseId, w.WarehouseName, w.StockOnHand as StockOnHandInWarehouse
,l.Id as LocationId, l.Name as LocationName, l.Fascia, r.DateLastReceived
,case when ISNULL(sr.quantity - sr.quantityreceived - sr.quantitycancelled, 0) > 0 then 1 else 0 end as StockRequisitionPending
FROM Merchandising.Product p
inner join Merchandising.Location l on (p.storetypes like '%"' + l.storetype + '"%' OR nullif(nullif(p.StoreTypes, '[]'), '') is null) and warehouse = 0
inner join [Merchandising].[ProductLastReceivedView] r on r.productid = p.id 
inner join WarehouseStock w on w.productId = p.Id
LEFT JOIN Merchandising.ProductStockLevel s on s.productid = p.id and l.Id = s.locationId
LEFT JOIN Merchandising.StockRequisitionProduct sr on sr.ReceivingLocationId = l.Id and sr.ProductId = p.Id
WHERE isnull(s.Stockonhand, 0) <= 0