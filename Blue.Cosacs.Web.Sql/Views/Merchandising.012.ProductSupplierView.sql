IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].ProductSupplierView'))
DROP VIEW [Merchandising].ProductSupplierView
GO

CREATE VIEW [Merchandising].[ProductSupplierView]
AS
 SELECT ROW_NUMBER() OVER( ORDER BY productid ) AS Id,
 ps.ProductId,
 s.Id [SupplierId],
 s.Name [SupplierName]
FROM 
 [Merchandising].[ProductSupplier] ps 
 INNER JOIN 
 [Merchandising].[Supplier] s on ps.SupplierId = s.Id
 GO