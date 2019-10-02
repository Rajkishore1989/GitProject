IF EXISTS( SELECT *
             FROM sys.views
             WHERE object_id = OBJECT_ID( N'[Service].[ReceiptBranchDetailsView]' ))BEGIN
        DROP VIEW Service.ReceiptBranchDetailsView
END

GO

CREATE VIEW [Service].[ReceiptBranchDetailsView]
AS
SELECT     dbo.branch.branchno AS BranchNo, dbo.branch.branchname AS BranchName, dbo.branch.branchaddr1 AS BranchAddress1, dbo.branch.branchaddr2 AS BranchAddress2, 
                      dbo.branch.branchaddr3 AS BranchAddress3, M.Value AS TaxNumber
FROM         dbo.branch INNER JOIN
                      dbo.CountryMaintenance AS M ON dbo.branch.countrycode = M.CountryCode AND M.CodeName = 'TaxNumber'

GO
