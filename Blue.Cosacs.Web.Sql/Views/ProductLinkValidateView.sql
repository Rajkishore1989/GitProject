IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[ProductLinkValidateView]'))
DROP VIEW [Merchandising].[ProductLinkValidateView]
GO

CREATE VIEW [Merchandising].[ProductLinkValidateView]
AS
SELECT
    ROW_NUMBER() OVER (ORDER BY i.ID, i.ItemNo, i.Category, p.branchno) AS Id,
	c.category AS Department,
	i.Category,
	i.Class,
	b.StoreType,
	p.branchno AS OrigBr,
	i.ItemNo,
    i.IUPC,
    p.RefCode
FROM StockInfo i
INNER JOIN StockPrice p ON i.id = p.id
INNER JOIN StockQuantity q ON i.id = q.id AND p.branchno = q.stocklocn
INNER JOIN ProductHeirarchy h_cat ON h_cat.CatalogType = '02' AND h_cat.primarycode = CAST(i.category AS VARCHAR(10))
INNER JOIN ProductHeirarchy h_class ON h_class.CatalogType = '03' AND i.Class = h_class.primarycode AND h_cat.PrimaryCode = h_class.ParentCode
INNER JOIN code c ON i.category = c.code AND c.category IN ('PCE', 'PCW', 'PCF', 'PCO')
INNER JOIN branch b ON b.branchno = p.branchno
WHERE i.Category NOT IN (12,82)

GO


