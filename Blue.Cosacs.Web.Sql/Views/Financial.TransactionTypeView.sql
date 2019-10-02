IF OBJECT_ID('Financial.TransactionTypeView') IS NOT NULL
	DROP VIEW Financial.TransactionTypeView
GO

CREATE VIEW Financial.TransactionTypeView
AS
	SELECT
        transtypecode AS Id,
        [description] AS Name
	FROM 
		dbo.transtype
    WHERE
        transtypecode!=''
GO
