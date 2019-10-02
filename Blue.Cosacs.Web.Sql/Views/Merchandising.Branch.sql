IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[branch]'))
DROP VIEW  Merchandising.Branch
Go

CREATE VIEW Merchandising.Branch
AS
select branchno, branchname, StoreType
from dbo.branch
go