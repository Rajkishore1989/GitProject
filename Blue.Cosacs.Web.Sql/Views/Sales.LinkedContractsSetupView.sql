/*
View over Sales.[LinkedContractNames] and Sales.[LinkedContracts]

*/

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Sales].[LinkedContractsSetupView]'))
DROP VIEW [Sales].[LinkedContractsSetupView]
GO


CREATE VIEW [Sales].[LinkedContractsSetupView]
AS
	
	select cn.[Contract], isnull(c.ItemNo, '') as ItemNo, ISNULL(c.Category, '') as Category
	from Sales.[LinkedContractNames] cn left join Sales.[LinkedContracts] c on cn.[Contract] = c.[Contract]

GO
