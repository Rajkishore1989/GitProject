IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'BranchLookup'
		   AND ss.name = 'Service')
DROP VIEW  Service.BranchLookup
GO

CREATE VIEW Service.BranchLookup
AS
SELECT
	branchno,
    BranchNameLong = branchname + ' ' + CONVERT(VARCHAR(10), branchno),
    branchname,
    countrycode,
    servicelocation,
    StoreType,
    ServiceRepairCentre
FROM dbo.branch
GO