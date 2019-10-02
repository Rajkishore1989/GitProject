IF OBJECT_ID('Stock.Branch') IS NOT NULL
	DROP VIEW Stock.Branch
GO

CREATE VIEW Stock.[Branch]
AS
select branchno, branchname, StoreType
from dbo.branch

GO