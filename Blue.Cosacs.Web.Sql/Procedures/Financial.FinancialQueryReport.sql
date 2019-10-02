IF OBJECT_ID('Financial.FinancialQueryReport') IS NOT NULL
	DROP PROCEDURE Financial.FinancialQueryReport
GO

CREATE PROCEDURE Financial.FinancialQueryReport
	@RunNumber INT = NULL
	,@AccountNumber VARCHAR(30) = NULL
	,@LocationNumber VARCHAR(100)= NULL
	,@TransactionCode VARCHAR(10) = NULL
	,@DateTo SmallDateTime = NULL
	,@DateFrom SmallDateTime = NULL
AS
	

	SELECT
	[RunNo],[Account],[BranchNo],[Type],[Amount],[Date],[Description]
	FROM [Financial].[Transaction]
	WHERE (@RunNumber IS NULL OR [RunNo] = @RunNumber)
	AND (@AccountNumber IS NULL OR [Account] = @AccountNumber)
	AND (@LocationNumber IS NULL OR [BranchNo] = @LocationNumber)
	AND (@TransactionCode IS NULL OR [Type] = @TransactionCode)
	AND (@DateTo IS NULL OR [Date] >= @DateTo)
	AND (@DateFrom IS NULL OR [Date] <= @DateFrom)



