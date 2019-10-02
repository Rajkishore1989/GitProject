IF OBJECT_ID('Financial.MarkTransactionsAsExported') IS NOT NULL
	DROP PROCEDURE Financial.MarkTransactionsAsExported
GO

CREATE PROCEDURE Financial.MarkTransactionsAsExported
	@RunNumber Int
AS

	UPDATE Financial.[Transaction]
		SET RunNo = @RunNumber
	WHERE
		RunNo IS NULL