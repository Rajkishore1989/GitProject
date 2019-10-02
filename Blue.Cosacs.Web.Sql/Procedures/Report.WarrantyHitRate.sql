IF OBJECT_ID('Report.WarrantyHitRate') IS NOT NULL
    DROP PROCEDURE Report.WarrantyHitRate
GO

CREATE PROCEDURE Report.WarrantyHitRate
    @DateFrom                    Date,
    @DateTo                      Date,
    @BranchNumber                SmallInt = NULL,
    @StoreType                   Char(1) = NULL,
    @SalesPersonId               Int = NULL,
    @IncludeReprocessedCancelled Bit = 0
AS

    SET NOCOUNT ON

	IF OBJECT_ID('tempdb..#d','U') IS NOT NULL 
		DROP TABLE #d

	--------------------------------------------
	---   Get all data from delivery table   ---
	--------------------------------------------

	SELECT ItemId, delorcoll, acctno, ParentItemID, contractno, CONVERT(DATE, d.datetrans) AS datetrans, d.itemno, quantity, d.agrmtno, d.branchno, CONVERT(DECIMAL(18, 2), d.transvalue) AS Value, si.itemtype
	INTO #d
	FROM 
		delivery d 
		INNER JOIN StockInfo si
			ON d.ItemID = si.Id
	WHERE  CONVERT(DATE, d.datetrans) BETWEEN @DateFrom AND @DateTo AND d.itemno != 'STAX'

	------------------------------------------------------
	---   Get only the returned/cancelled warranties   ---
	------------------------------------------------------
	;WITH ReturnedWarranties(delorcoll, AccountNumber, ParentItemID, AgreementNumber, WarrantySalePrice, WarrantyCostPrice) AS
	(
		SELECT d.delorcoll, d.acctno, d.ParentItemID, d.agrmtno, CONVERT(DECIMAL(18, 2), s.WarrantySalePrice) AS WarrantySalePrice, CONVERT(DECIMAL(18, 2), s.WarrantyCostPrice) AS WarrantyCostPrice
		FROM  
			#d d
			INNER JOIN Warranty.WarrantySale s
				ON d.acctno = s.CustomerAccount
				AND d.agrmtno = s.AgreementNumber
				AND d.contractno = s.WarrantyContractNo
				AND ISNULL(s.WarrantyType, '') != 'F' /*No point on free warranties*/
		WHERE  ((d.delorcoll = 'C' AND contractno != '') OR (d.delorcoll = 'R' AND d.quantity < 0  AND contractno != '')) AND d.itemtype != 's'
	              /*Calcel Itemns*/                             /*Repossesed Itemns*/
               AND 1 = @IncludeReprocessedCancelled --to exclude all the reutern stuff if the user do not want it
	),
	----------------------------------------------------
	---   Get only the returned/cancelled products   ---
	----------------------------------------------------
	ReturnedProducts(ItemId, delorcoll, AccountNumber, ParentItemID, contractno, datetrans, itemno, quantity, AgreementNumber, BranchNumber, Value) AS
	(
		SELECT ItemId, delorcoll, d.acctno, ParentItemID, contractno, datetrans, itemno, quantity, d.agrmtno, d.branchno, Value
		from  #d d
		where  d.delorcoll != 'D' AND contractno = '' AND d.itemtype = 's' --only deliverys and stock itens
               AND 1 = @IncludeReprocessedCancelled --to exclude all the reutern stuff if the user do not want it
	),
	------------------------------
	---   Get the warranties   ---
	------------------------------
	Warranties(StockLocation, WarrantyContractNo, ItemId, itemno, AccountNumber, ParentItemID, AgreementNumber, WarrantySalePrice, WarrantyCostPrice, WarrantyId) AS
	(
		SELECT s.StockLocation, s.WarrantyContractNo, d.ItemId, d.itemno, d.acctno, d.ParentItemID, d.agrmtno, CONVERT(DECIMAL(18, 2), s.WarrantySalePrice) AS WarrantySalePrice, CONVERT(DECIMAL(18, 2), s.WarrantyCostPrice) AS WarrantyCostPrice, s.WarrantyId
		FROM  
			#d d  
			INNER JOIN Warranty.WarrantySale s 
				ON d.acctno = s.CustomerAccount
				AND d.agrmtno = s.AgreementNumber
				AND d.contractno = s.WarrantyContractNo
				AND ISNULL(s.WarrantyType, '') != 'F' /*No point on free warranties*/
		where  d.delorcoll = 'D' AND contractno != '' AND d.itemtype != 's' --only deliverys and non stock itens
	),
	----------------------------
	---   Get the products   ---
	----------------------------
	Products(ItemId, delorcoll, AccountNumber, ParentItemID, contractno, datetrans, itemno, quantity, AgreementNumber, BranchNumber, Value) AS
	(
		SELECT ItemId, delorcoll, d.acctno, ParentItemID, contractno, datetrans, itemno, quantity, d.agrmtno, d.branchno, Value
		from  #d d
		where  d.delorcoll = 'D' AND contractno = '' AND d.itemtype = 's' --only deliverys and stock itens
	),
	-------------------------------
	---   Get Potential Sales   ---
	-------------------------------
	PotentialSale(AccountNumber, AgreementNumber, ItemId, WarrantyPotentialSalePrice) AS
	(
		SELECT CustomerAccount, AgreementNumber, ItemId, CONVERT(DECIMAL(18, 2), MAX(p.WarrantyRetailPrice)) AS WarrantyPotentialSalePrice
		FROM Warranty.WarrantyPotentialSale p
		WHERE  
			ISNULL(p.WarrantyType, '') != 'F' --no free warranties
			AND p.SoldOn BETWEEN @DateFrom AND @DateTo 
		GROUP BY 
			CustomerAccount, AgreementNumber, ItemId
	)
	SELECT 
	    p.BranchNumber																	AS [Branch Number],
        CASE
            WHEN a.accttype = 'S' AND ca.acctno IS NOT NULL THEN 'POS'
            WHEN a.accttype IN ('B', 'M', 'O', 'R') THEN 'Credit'
            WHEN a.accttype = 'C' THEN 'Cash'
            WHEN a.accttype = 'G' THEN 'POS' 
            ELSE 'POS'
        END																				AS [Account Type],
        ph.PrimaryCode + ' - ' + ph.CodeDescription										AS [Product Category],
        saleperson.id																	AS [Sales Person Id],
        saleperson.fullname																AS [Sold By],
        CASE WHEN b.StoreType = 'C'
            THEN 'COURTS'
            ELSE 'NON COURTS (Tropigas/Lucky Dollar)'
        END																				AS [Store Type],
		SUM(p.Quantity)																	AS [No. Product Sales],
        SUM(p.Value) + SUM(ISNULL(rp.Value, 0))											AS [Value of Product Sales],
		SUM(ISNULL(w.TotalRcordCount, 0)) - COUNT(r.ParentItemID)						AS [No. Warranty Sales],
		SUM(w.WarrantyCostPrice) - SUM(ISNULL(r.WarrantyCostPrice, 0))					AS [Cost of warranty sales],
        SUM(w.WarrantySalePrice) - SUM(ISNULL(r.WarrantySalePrice, 0))					AS [Value of warranty sales],
		SUM(CASE WHEN ISNULL(c.warrantable, 0) = 0 THEN 0 ELSE p.quantity END)		    AS [Number of warrantable sales],
		MAX(PS.WarrantyPotentialSalePrice)												AS [Potential value of warranty sales],
		SUM(CASE WHEN r.delorcoll = 'c' THEN 1 ELSE 0 END)								AS [Number of warranties cancelled],
		SUM(CASE WHEN r.delorcoll = 'c' THEN r.WarrantySalePrice ELSE 0 END)			AS [Value of warranties cancelled],
		SUM(CASE WHEN r.delorcoll = 'r' THEN 1 ELSE 0 END)								AS [Number of warranties repossessed],
		SUM(CASE WHEN r.delorcoll = 'r' THEN r.WarrantySalePrice ELSE 0 END)			AS [Value of warranties repossessed],
        SUM(CONVERT(DECIMAL(18,2), sc.CommissionAmount))								AS [Commission paid to sales staff],
		CONVERT(VARCHAR(7), CONVERT(DECIMAL(18,2), 
		(
			CONVERT(DECIMAL(18,2), SUM(ISNULL(w.TotalRcordCount, 0)) - COUNT(r.ParentItemID))
			/ 
			CONVERT(DECIMAL(18,2), ISNULL(NULLIF(SUM(CASE WHEN ISNULL(c.warrantable, 0) = 0 THEN 0 ELSE p.quantity END), 0), 1))
		)  * 100)) + '%'																AS [Hit Rate (%)]
	FROM
		Products p
		LEFT JOIN ReturnedProducts rp
			ON p.AccountNumber = rp.AccountNumber
			AND p.AgreementNumber = rp.AgreementNumber
			AND rp.ItemId = rp.ItemId
		LEFT JOIN 
		(
			SELECT 
				COUNT(*) AS TotalRcordCount,
				d.AccountNumber, d.ParentItemID, d.AgreementNumber,
				MAX(d.ItemId) AS ItemId, 
				SUM(WarrantyCostPrice) AS WarrantyCostPrice,
				SUM(WarrantySalePrice) AS WarrantySalePrice
			FROM Warranties d  
			GROUP BY d.AccountNumber, d.ParentItemID, d.AgreementNumber
		) w
			ON p.AccountNumber = w.AccountNumber
			AND p.ItemId = w.ParentItemID
			AND p.AgreementNumber = w.AgreementNumber
		LEFT JOIN ReturnedWarranties r
			ON p.AccountNumber = r.AccountNumber
			AND p.ItemId = r.ParentItemID
			AND p.AgreementNumber = r.AgreementNumber	
		INNER JOIN acct a
            ON p.AccountNumber = a.acctno
        INNER JOIN branch b
            ON p.BranchNumber = b.branchno
		LEFT JOIN custacct ca -- to select accountType's = POS
            ON p.AccountNumber = ca.acctno
            AND ca.custid = 'PAID & TAKEN'
		LEFT JOIN StockInfo c
            ON p.ItemID = c.Id
		LEFT JOIN ProductHeirarchy ph
			ON CONVERT(VARCHAR, c.category) = ph.PrimaryCode
			AND ph.CatalogType = '02'
        INNER JOIN agreement agr
            ON p.AccountNumber = agr.acctno
            AND p.AgreementNumber = agr.agrmtno
        INNER JOIN [Admin].[User] saleperson
            ON saleperson.id = agr.empeenosale
		LEFT JOIN 
		(
			SELECT AcctNo, sc.ItemId, SUM(CommissionAmount) AS CommissionAmount
			FROM 
				SalesCommission sc
				INNER JOIN Warranties w
					ON w.WarrantyContractNo = sc.ContractNo
			GROUP BY AcctNo, sc.ItemId, StockLocn 
		) AS sc
  			ON w.AccountNumber = sc.AcctNo
			AND w.ItemId = sc.ItemId
		LEFT JOIN PotentialSale ps
			ON ps.AccountNumber  = p.AccountNumber
			AND ps.AgreementNumber = p.AgreementNumber  
			AND ps.ItemID = p.ItemId
	WHERE
        ISNULL(a.accttype, '') != ''
	    AND ISNULL(b.StoreType, '') = CASE
										WHEN @StoreType IS NULL THEN ISNULL(b.StoreType, '')
										ELSE @StoreType
									  END
        AND ISNULL(saleperson.id, 0) = CASE
											WHEN @SalesPersonId IS NULL THEN ISNULL(saleperson.id, 0)
											ELSE @SalesPersonId
										END
		AND p.BranchNumber = CASE WHEN @BranchNumber IS NULL THEN p.BranchNumber ELSE @BranchNumber END
	GROUP BY
        p.BranchNumber, a.accttype, ca.acctno, saleperson.Id, b.StoreType, saleperson.fullname, ph.PrimaryCode + ' - ' + ph.CodeDescription
	ORDER BY 
		 p.BranchNumber, saleperson.Id

	drop table #d