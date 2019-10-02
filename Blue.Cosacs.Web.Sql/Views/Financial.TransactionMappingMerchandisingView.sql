IF OBJECT_ID('Financial.TransactionMappingMerchandisingView') IS NOT NULL
	DROP VIEW Financial.TransactionMappingMerchandisingView
GO

CREATE VIEW Financial.TransactionMappingMerchandisingView
AS

SELECT
	CONVERT(Int,ROW_NUMBER() OVER (ORDER BY x.Account)) as Id,
	*
FROM (
	SELECT
		'Debit' as TransactionType,
		Name as TransactionDescription,
		CASE
			WHEN Name LIKE '%Parts%' THEN 'SparePart'
			ELSE NULL
		END as ProductType,
		NULL as SaleType,
		NULL as AdjustmentType,
		CASE	
			WHEN Name LIKE '%Foreign%' THEN 'International'
			WHEN Name LIKE '%Local%' THEN 'Local'
			ELSE NULL
		END as VendorType,
		1 as Percentage,
		TransactionCode,
		SplitDebitByDepartment,
		DebitAccount as Account
	FROM Merchandising.TransactionType

	UNION

	SELECT
		'Credit' as TransactionType,
		Name as TransactionDescription,
		CASE
			WHEN Name LIKE '%Parts%' THEN 'SparePart'
			ELSE NULL
		END as ProductType,
		NULL as SaleType,
		NULL as AdjustmentType,
		CASE
			WHEN Name LIKE '%Foreign%' THEN 'International'
			WHEN Name LIKE '%Local%' THEN 'Local'
			ELSE NULL
		END as VendorType,
		-1 as Percentage,
	 	TransactionCode,
		SplitCreditByDepartment,
		CreditAccount Account
	FROM Merchandising.TransactionType

	UNION

	SELECT 
		'Debit' as TransactionType,
		'Stock Adjustment' as TransactionDescription,
		NULL as ProductType,
		NULL as SaleType, 
		Id as AdjustmentType,
		NULL as VendorType,
		1 as Percentage,
		TransactionCode,
		SplitDebitByDepartment,
		DebitAccount as Account
	FROM Merchandising.StockAdjustmentSecondaryReason

	UNION

	SELECT 
		'Credit' as TransactionType,
		'Stock Adjustment' as TransactionDescription,
		NULL as ProductType,
		NULL as SaleType, Id as AdjustmentType,
		NULL as VendorType,
		-1 as Percentage,
		TransactionCode,
		SplitCreditByDepartment,
		CreditAccount Account
	FROM Merchandising.StockAdjustmentSecondaryReason
) x