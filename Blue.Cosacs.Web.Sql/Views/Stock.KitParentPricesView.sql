IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Stock].[KitParentPricesView]'))
DROP VIEW [Stock].[KitParentPricesView]
GO

CREATE VIEW [Stock].[KitParentPricesView]
AS
SELECT K.ItemID, K.origbr AS Branch, SUM(ISNULL(S.unitpricehp, 0)) AS UnitPriceHp, SUM(ISNULL(S.unitpricecash, 0)) AS UnitPriceCash
FROM dbo.kitproduct AS K
LEFT JOIN (
	SELECT
		i.itemno, p.CreditPrice AS unitpricehp, p.CashPrice AS unitpricecash, p.branchno AS origbr
	FROM StockInfo i
	INNER JOIN StockPrice p
		ON i.id = p.id
	INNER JOIN StockQuantity q
		ON i.id = q.id
		AND p.branchno = q.stocklocn
	INNER JOIN code c
		ON i.category = c.code
		AND c.category IN ('PCE', 'PCW', 'PCF', 'PCO', 'PCDIS')
	WHERE (q.deleted !='Y' OR c.category = 'PCDIS')
		AND i.category NOT IN (12,82)
) AS S
    ON S.itemno = K.componentno AND S.origbr = K.origbr
GROUP BY K.ItemID, K.origbr

GO