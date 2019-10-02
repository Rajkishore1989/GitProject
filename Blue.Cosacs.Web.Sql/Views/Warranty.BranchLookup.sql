IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'BranchLookup'
		   AND ss.name = 'Warranty')
DROP VIEW  Warranty.BranchLookup
GO

CREATE VIEW Warranty.BranchLookup
AS
SELECT
	branchno,
    BranchNameLong =  CONVERT(VARCHAR(10),branchno) + ' ' + branchname,
	branchname,
	StoreType
FROM dbo.branch
GO
