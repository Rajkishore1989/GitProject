IF OBJECT_ID('Sales.CustomerSearchView') IS NOT NULL
	DROP VIEW [Sales].[CustomerSearchView]
GO


/****** Object:  View [dbo].[CustomerSearchView]    Script Date: 30/09/2014 15:37:34 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [Sales].[CustomerSearchView]
AS
SELECT        c.custid AS CustomerId, c.title AS Title, c.firstname as FirstName, c.name AS LastName, c.alias as Alias, c.dateborn AS DOB, cth.telno AS HomePhoneNumber, ctm.telno AS MobileNumber, 
				ca.Email as Email, ca.cusaddr1 AS HomeAddressLine1, ca.cusaddr2 AS HomeAddressLine2, ca.cusaddr3 AS City, ca.cuspocode AS PostCode
FROM            dbo.customer AS c INNER JOIN
                             (SELECT        custid, tellocn, telno, datediscon
                               FROM            dbo.custtel
                               WHERE        (tellocn = 'H') AND (custid IS NOT NULL) AND (custid <> '')) AS cth ON c.custid = cth.custid INNER JOIN
                             (SELECT        custid, tellocn, telno, datediscon
                               FROM            dbo.custtel AS custtel_1
                               WHERE        (tellocn = 'M') AND (custid IS NOT NULL) AND (custid <> '')) AS ctm ON c.custid = ctm.custid INNER JOIN
                         dbo.custaddress AS ca ON c.custid = ca.custid
WHERE        (ca.addtype = 'H') AND (c.custid IS NOT NULL) AND (c.custid <> '') AND (ca.custid IS NOT NULL) AND (ca.custid <> '') AND (ca.datemoved IS NULL) AND (cth.datediscon IS NULL) 
AND (ctm.datediscon IS NULL)

GO
