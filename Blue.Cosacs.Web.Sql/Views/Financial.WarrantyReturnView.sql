IF OBJECT_ID('Financial.WarrantyReturnView') IS NOT NULL
	DROP VIEW Financial.WarrantyReturnView
GO

CREATE VIEW Financial.WarrantyReturnView
AS
	SELECT 
        W.Id, 
        W.ContractNumber, 
        W.DeliveredOn, 
        W.AccountType, 
        CASE 
            WHEN W.Department = 'PCW' 
            THEN 'PCE' 
            ELSE W.Department 
        END AS Department,
        W.SalePrice, 
        W.CostPrice, 
        W.BranchNo, 
        W.WarrantyNo, 
        W.WarrantyLength, 
        W.MessageId, 
		R.ElapsedMonths,
		R.PercentageReturn,
		(
            (CASE WHEN R.BranchType   = B.BranchType THEN 1 ELSE 0 END) 
            |
			(CASE WHEN R.BranchNumber = W.BranchNo   THEN 2 ELSE 0 END) 
            |
			(CASE WHEN R.WarrantyId   = WW.Id		 THEN 4 ELSE 0 END)
       ) AS [Level],
       ww.TaxRate,
       isnull(wsf.WarrantyLength,0) as FreeWarrantyLength
	from 
        Financial.WarrantyMessage W
        INNER JOIN
            Warranty.WarrantySale wse on wse.WarrantyContractNo = W.ContractNumber
	    INNER JOIN Financial.BranchView B
	        ON W.BranchNo = B.BranchNo
	    INNER JOIN Warranty.Warranty WW
	        ON W.WarrantyNo = WW.Number
        LEFT JOIN warranty.WarrantySale wsf 
           -- ON ws.WarrantyContractNo = w.ContractNumber + 'M'
            ON wsf.CustomerAccount = wse.CustomerAccount
            and wsf.ItemId = wse.ItemId
            and wsf.StockLocation = wse.StockLocation
            and wsf.WarrantyGroupId = wse.WarrantyGroupId
            and wsf.WarrantyType = 'F'
	    INNER JOIN Warranty.WarrantyReturn R
	        ON  (R.BranchType IS NULL     OR R.BranchType     = B.BranchType)
	        AND (R.BranchNumber IS NULL   OR R.BranchNumber   = W.BranchNo)
	        AND (R.WarrantyId IS NULL     OR R.WarrantyId     = WW.Id)
	        AND (R.WarrantyLength IS NULL OR R.WarrantyLength = W.WarrantyLength)
	        AND (R.Level_1 IS NULL OR r.Level_1 = CASE WHEN W.Department = 'PCW' THEN 'PCE' ELSE w.Department END)
            AND (R.FreeWarrantyLength IS NULL OR r.FreeWarrantyLength = ISNULL(wsf.WarrantyLength, 12))
GO