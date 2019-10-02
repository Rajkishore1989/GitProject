IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[CustTelView]'))
DROP VIEW  service.CustTelView
Go

CREATE VIEW service.CustTelView
AS
SELECT CASE WHEN tellocn = 'H' THEN 'HomePhone'
            WHEN tellocn = 'W' THEN 'WorkPhone' 
            ELSE 'MobilePhone' END as Type , telno,custid 
FROM dbo.custtel
WHERE tellocn IN ('h','W','M')
and datediscon is null		-- jec 11/03/13 not discontinued


