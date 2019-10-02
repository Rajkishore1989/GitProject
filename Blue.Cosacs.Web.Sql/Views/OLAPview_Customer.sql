IF OBJECT_ID('OLAPview_Customer') IS NOT NULL
	DROP VIEW OLAPview_Customer
GO

CREATE VIEW OLAPview_Customer
AS
	SELECT 
		c.custid AS CustomerId,
		c.name AS SurName,
		c.firstname AS FirstName,
		c.title AS Title,
		ISNULL(c.title + ' ', '') + ISNULL(c.firstname + ' ', '') + c.name AS FullName,
		c.dateborn,
		c.age,
		CASE
			WHEN c.sex IN ('M', 'F') THEN c.sex
			ELSE ''
		END AS Sex,
		c.dependants,
		HomePhone.Number AS HomePhone,
		MobilePhone.Number AS MobilePhone,
		HomeAddress.AddressLine1,
		HomeAddress.AddressLine2,
		HomeAddress.AddressLine3,
		HomeAddress.PostalCode
	FROM 
		Customer c
		LEFT JOIN
		(
			SELECT t.custid, MAX(t.telno) AS Number FROM custtel t WHERE t.datediscon IS NULL AND t.tellocn = 'H ' AND LEN(ISNULL(t.telno, '')) > 0 GROUP BY t.custid
		) AS HomePhone
			ON c.custid = HomePhone.custid
		LEFT JOIN
		(
			SELECT t.custid, MAX(t.telno) AS Number FROM custtel t WHERE t.datediscon IS NULL AND t.tellocn = 'M ' AND LEN(ISNULL(t.telno, '')) > 0 GROUP BY t.custid
		)AS MobilePhone
			ON c.custid = MobilePhone.custid
		LEFT JOIN
		(
			SELECT a.custid, a.cusaddr1 AS AddressLine1, a.cusaddr2 AS AddressLine2, a.cusaddr3 AS AddressLine3, a.cuspocode AS PostalCode FROM custaddress a WHERE a.custid !='' AND a.addtype = 'H '
		) AS HomeAddress
			ON c.custid = HomeAddress.custid
GO