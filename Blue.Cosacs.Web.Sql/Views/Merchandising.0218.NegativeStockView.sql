IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[NegativeStockSnapshotView]'))
DROP VIEW  [Merchandising].NegativeStockSnapshotView
GO

create view [Merchandising].NegativeStockSnapshotView 
as

SELECT 
s.*, 
l.Fascia,
l.Name as 'Location',
p.SKU as 'Sku',
p.LongDescription as 'Description',
p.ProductType,
p.Tags
FROM Merchandising.NegativeStockSnapshot s
inner join Merchandising.Location l ON s.LocationId = l.Id
inner join Merchandising.Product p ON s.ProductId = p.Id
and (nullif(nullif(p.storetypes, ''), '[]') is null OR p.storetypes like '%"'+l.storetype+'"%')
