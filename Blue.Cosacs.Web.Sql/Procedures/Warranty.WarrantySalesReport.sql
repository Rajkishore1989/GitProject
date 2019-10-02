
if object_id('[Warranty].WarrantySalesReport') IS NOT NULL
    DROP PROCEDURE [Warranty].WarrantySalesReport
GO

CREATE PROCEDURE [Warranty].WarrantySalesReport
	@dateWarrantyDeliveredFrom date, 
	@dateWarrantyDeliveredTo date, 
	@salesType char( 1 ) = NULL, 
	--A = All, R = Renewals, F = First Effort, S = Second Effort Solicitation
	@fascia char( 1 ) = NULL, 
	--A = All, C = Courts, N = Non-Courts
	@branch smallint = NULL, 
	@warrantyType varchar( 2 ) = NULL, 
	--B = both, EW = Extended Warranty, IR = Instant Replacement
	@PageIndex int = 1, 
	@PageSize bigint = 250
AS
	IF @branch IS NOT NULL  BEGIN
		SET @fascia = NULL
	END

	DECLARE @FirstRec int, 
			@LastRec bigint

	IF ISNULL( @PageIndex, 0 ) < 1 BEGIN
		SET @PageIndex = 1
	END

	IF ISNULL( @PageSize, 0 ) < 1 BEGIN
		SET @PageSize = 250
	END

	SET @FirstRec = (@PageIndex - 1) * @PageSize
	SET @LastRec = @PageIndex * @PageSize + 1;
	WITH ProductCount
		AS ( SELECT DISTINCT
				CustomerAccount, 
				ws.ItemId,
				ws.AgreementNumber,
				ws.StockLocation,
				sum( d.quantity )AS ProductCount			-- #19104
			   FROM
					warranty.WarrantySale ws INNER JOIN delivery d
					ON ws.CustomerAccount = d.acctno AND 
					   ws.AgreementNumber = d.agrmtno AND 
					   ws.itemId = d.ItemId	AND	-- #19104
					   ws.StockLocation = d.stocklocn
			   WHERE ISNULL( WarrantyType, 'F' ) <> 'F'			-- #19104
					 AND 
					 (WarrantyDeliveredOn BETWEEN @dateWarrantyDeliveredFrom AND @dateWarrantyDeliveredTo OR 
					  WarrantyDeliveredOn IS NULL)
			   GROUP BY CustomerAccount, 
						AgreementNumber, 
						ws.ItemId, 
						WarrantyGroupId,			-- #19104
						ws.AgreementNumber,
						ws.StockLocation
		), Renewals
		AS ( SELECT CustomerAccount
			   FROM
					warranty.WarrantySale ws INNER JOIN warranty.renewal r
					ON ws.WarrantyId = r.RenewalId
			   WHERE ISNULL( WarrantyType, 'E' ) <> 'F' AND 
					 (WarrantyDeliveredOn BETWEEN @dateWarrantyDeliveredFrom AND @dateWarrantyDeliveredTo OR 
					  WarrantyDeliveredOn IS NULL)
			   GROUP BY CustomerAccount )
		SELECT DISTINCT CONVERT( varchar( 10 ), ws.WarrantyDeliveredOn, 103 )AS [Warranty Delivery Date], 
						CONVERT( varchar( 10 ), ws.ItemDeliveredOn, 103 )AS [Item Delivery Date], 
						CONVERT( varchar( 10 ), ws.SoldOn, 103 )AS [Order Date], 
						CASE
						WHEN wr.CustomerAccount IS NOT NULL THEN 'Renewal'
						WHEN ws.ItemDeliveredOn = ws.WarrantyDeliveredOn THEN 'First Effort Solicitation'
						WHEN ws.ItemDeliveredOn != ws.WarrantyDeliveredOn THEN 'Second Effort Solicitation'
						END AS [Sale Type], 
						CASE
						WHEN b.StoreType = 'C' THEN 'Courts'
							ELSE 'Non-Courts'
						END AS Fascia, 
						CAST( b.branchno AS varchar( 10 )) + ' - ' + b.branchname AS [Branch Name], 
						ws.CustomerAccount AS [Account Number], 
						ws.WarrantyContractNo AS [Contract Number], 
						ws.ItemNumber AS [Product Item Number], 
						p.ProductCount AS [Item Quantity], 
						LTRIM(RTRIM(si.itemdescr1)) +  ' ' + LTRIM(RTRIM(si.itemdescr2)) AS [Item Description],  -- #20369
						ws.WarrantyNumber AS [Warranty Item Number], 
						w.Description AS [Warranty Description], 
						CASE -- Account type (cash/credit/POS)
						WHEN a.accttype = 'C' THEN 'Cash'
						WHEN a.accttype IN( 'B', 'M', 'O', 'R', 'T' )THEN 'Credit'
							ELSE 'POS'
						END AS [Account Type], 
						si.category AS [Item Category], 
						ws.SoldById AS [Sales Person Username], 
						ws.SoldBy AS [Sales Person Name], 
						CASE
						WHEN ws.WarrantyType = 'E' THEN 'EW'
						WHEN ws.WarrantyType = 'I' THEN 'IR'
						END AS [Warranty Type], 
						CAST( ws.ItemPrice AS decimal( 15, 2 ))AS [Item Value], 
						CAST( ws.WarrantyRetailPrice AS decimal( 15, 2 ))AS [Warranty Retail Value], 
						CAST( ws.WarrantyCostPrice AS decimal( 15, 2 ))AS [Warranty Cost Price], 
						IDENTITY( int )AS SortID INTO #WarrantySalesData
		FROM warranty.WarrantySale ws 
		INNER JOIN warranty.Warranty w
			ON ws.WarrantyId = w.Id
		INNER JOIN branch b
			   ON ws.SaleBranch = b.branchno
		INNER JOIN stockinfo si
			   ON ws.ItemId = si.Id
		INNER JOIN ProductCount p
			ON p.CustomerAccount = ws.CustomerAccount AND 
				p.ItemId = ws.ItemId AND p.AgreementNumber = ws.AgreementNumber AND
				p.StockLocation = ws.StockLocation
		INNER JOIN acct a
			ON ws.CustomerAccount = a.acctno
		LEFT JOIN Renewals wr
			   ON ws.CustomerAccount = wr.CustomerAccount
		WHERE ws.WarrantyType <> 'F' AND 
			ws.WarrantyContractNo IS NOT NULL AND 
			ws.WarrantyDeliveredOn BETWEEN @dateWarrantyDeliveredFrom AND @dateWarrantyDeliveredTo AND 
			(@salesType IS NULL OR 
			 @salesType = 'A' OR 
			 ws.ItemDeliveredOn = ws.WarrantyDeliveredOn AND 
			 wr.CustomerAccount IS NULL AND 
			 @salesType = 'F' OR 
			 ws.ItemDeliveredOn != WarrantyDeliveredOn AND 
			 @salesType = 'S' OR 
			 wr.CustomerAccount IS NOT NULL AND 
			 @salesType = 'R') AND 
			(@fascia IS NULL OR 
			 b.StoreType = @fascia OR 
			 @fascia = 'A') AND 
			(@branch IS NULL OR 
			 b.branchno = @branch) AND 
			(@warrantyType IS NULL OR 
			 @warrantyType = 'B' OR					-- #19077 
			 ws.WarrantyType = 'E' AND 
			 @warrantyType = 'EW' OR 
			 ws.WarrantyType = 'I' AND 
			 @warrantyType = 'IR')
		--ORDER BY ws.WarrantyDeliveredOn
		ORDER BY [Warranty Delivery Date];

	WITH Results_CTE
		AS ( SELECT ROW_NUMBER( )OVER( ORDER BY CONVERT( datetime, [Warranty Delivery Date], 103 )DESC )AS RowNo, 
					COUNT( 1 )OVER( )AS TotalCount, 
					[Warranty Delivery Date], 
					[Item Delivery Date], 
					[Order Date], 
					[Sale Type], 
					Fascia, 
					[Branch Name], 
					[Account Number], 
					[Contract Number], 
					[Product Item Number], 
					[Item Quantity], 
					[Item Description], 
					[Warranty Item Number], 
					[Warranty Description], 
					[Account Type], 
					[Item Category], 
					[Sales Person Username], 
					[Sales Person Name], 
					[Warranty Type], 
					[Item Value], 
					[Warranty Retail Value], 
					[Warranty Cost Price]
			   FROM #WarrantySalesData )
		SELECT *
		  FROM Results_CTE
		  WHERE RowNo > @FirstRec AND 
				RowNo < @LastRec
		UNION
		SELECT NULL, 
			   NULL, 
			   'Totals', 
			   '', 
			   '', 
			   '', 
			   '', 
			   '', 
			   '', 
			   '', 
			   '', 
			   NULL, 
			   '', 
			   '', 
			   '', 
			   '', 
			   NULL, 
			   NULL, 
			   '', 
			   '', 
			   SUM( [Item Value] ), 
			   SUM( [Warranty Retail Value] ), 
			   SUM( [Warranty Cost Price] )
		  FROM Results_CTE
Go

