IF EXISTS (SELECT * FROM sys.views where name = 'ProductSupplierConcatView')
DROP VIEW [Merchandising].[ProductSupplierConcatView]
GO

CREATE VIEW [Merchandising].[ProductSupplierConcatView]
AS

SELECT DISTINCT
  p.Id as ProductId, 
  Suppliers = '['+STUFF
  (
    (
      SELECT ',' + '"'+s.SupplierName+'"'
       FROM Merchandising.ProductSupplierView AS s
	   WHERE s.ProductId = p.Id
       FOR XML PATH(''), TYPE
    ).value('.[1]','nvarchar(max)'),
    1,1,''
  )+']'
FROM Merchandising.Product AS p

GO

