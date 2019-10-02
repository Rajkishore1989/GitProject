IF OBJECT_ID('Financial.BranchView') IS NOT NULL
	DROP VIEW Financial.BranchView
GO

CREATE VIEW Financial.BranchView
AS
	SELECT branchno as BranchNo, StoreType as BranchType
	FROM dbo.branch
GO