IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ForcePurchaseOrderIndexView]'))
DROP VIEW  [Merchandising].[ForcePurchaseOrderIndexView]
GO

CREATE VIEW Merchandising.ForcePurchaseOrderIndexView
AS
SELECT po.Id as Id, s.Id as VendorId, isnull(s.Code, '') + ' - '+ po.Vendor as Vendor
, l.LocationId + ' - '+ po.ReceivingLocation as ReceivingLocation
, convert(varchar(max), ReferenceNumbers) as ReferenceNumbers, po.[Status]
, po.CreatedBy as CreatedBy
, po.currency + convert(varchar, sum(quantityordered * unitcost)) as TotalCost, po.CorporatePoNumber, po.OriginSystem
FROM Merchandising.PurchaseOrder po
INNER JOIN Merchandising.Supplier s on po.VendorId = s.Id
INNER JOIN Merchandising.Location l on l.id = po.ReceivingLocationId
INNER JOIN Merchandising.PurchaseOrderProduct pp on pp.purchaseorderid = po.id
group by po.Id ,s.Code,po.Vendor, s.Id
, l.LocationId , po.ReceivingLocation
, convert(varchar(max), ReferenceNumbers), po.[Status]
, po.CreatedById, po.CreatedBy
, po.currency, po.CorporatePoNumber, po.OriginSystem


GO
