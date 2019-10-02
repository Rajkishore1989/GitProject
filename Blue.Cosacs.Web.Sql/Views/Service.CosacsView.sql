IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Service].[CustomerSearchView]'))
DROP VIEW  [Service].[CustomerSearchView]
GO

CREATE VIEW Service.CustomerSearchView
AS
SELECT ca.custid,acct.acctno, l.ItemId,price, l.stocklocn, si.itemdescr1,si.Supplier, d.datedel,c.title,c.firstname,c.name AS lastname,cadd.cusaddr1,cadd.cusaddr2,cadd.cusaddr3,cadd.cuspocode, empeenosale AS SoldBy,dateagrmt AS SoldOn, u.FullName AS SoldByName
FROM dbo.custacct ca
INNER JOIN acct ON ca.acctno = dbo.acct.acctno
INNER JOIN lineitem l ON dbo.acct.acctno = l.acctno
INNER JOIN dbo.StockInfo si ON l.ItemID = si.ID
INNER JOIN delivery d ON si.ID = d.ItemID
INNER JOIN customer c ON c.custid = ca.custid
INNER JOIN dbo.custaddress cadd ON ca.custid = cadd.custid
INNER JOIN dbo.agreement ON acct.acctno = dbo.agreement.acctno
INNER JOIN admin.[user] u  ON u.id = dbo.agreement.empeenosale
WHERE l.itemtype = 'S'
AND l.acctno = d.acctno
AND l.agrmtno = d.agrmtno
AND l.contractno = d.contractno
AND l.stocklocn = d.stocklocn
AND cadd.addtype = 'H'

