IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warranty].[SalePersonView]'))
DROP VIEW [Warranty].[SalePersonView]
GO

CREATE VIEW [Warranty].[SalePersonView]
AS
	SELECT DISTINCT
		u.Id,
		u.FullName AS Name
	FROM 
		agreement a
		INNER JOIN Admin.[User] u
			ON a.empeenosale = u.Id
GO
