IF OBJECT_ID('Financial.AccountView') IS NOT NULL
	DROP VIEW Financial.AccountView
GO

CREATE VIEW Financial.AccountView
AS
	SELECT 
		acctno as AccountNo,
		accttype as AccountType
	FROM 
		dbo.acct
GO