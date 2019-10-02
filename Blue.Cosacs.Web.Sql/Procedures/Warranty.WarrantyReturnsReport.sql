if object_id('[Warranty].WarrantyReturnsReport') IS NOT NULL
    DROP PROCEDURE [Warranty].WarrantyReturnsReport
GO

CREATE PROCEDURE [Warranty].WarrantyReturnsReport
    @dateFrom		DATE,             --Cancelled/Repossessed from
    @dateTo			DATE,             --Cancelled/Repossessed to
    @fascia			char(1) = null,   --A = All, C = Courts, N = Non-Courts
    @branch			smallint = null,
    @returnType		char(1) = null,   --A = All, C = Cancellation, R = Repossession
    @warrantyType	varchar(2) = null,--B = both, EW = Extended Warranty, IR = Instant Replacement
	@PageIndex		int = 1,
	@PageSize       bigint = 250
AS

	DECLARE @FirstRec int,
			@LastRec bigint

	IF ISNULL(@PageIndex, 0) < 1
		SET @PageIndex = 1

	IF ISNULL(@PageSize, 0) < 1
		SET @PageSize = 250

	SET @FirstRec = (@PageIndex - 1 ) * @PageSize
	SET @LastRec = ( @PageIndex * @PageSize + 1 )

    IF OBJECT_ID('tempdb..#delivery','U') IS NOT NULL
        DROP TABLE #delivery

    IF OBJECT_ID('tempdb..#WarrantySale','U') IS NOT NULL
        DROP TABLE #WarrantySale

    SELECT
        CONVERT(DATE, datedel) AS datedel,
        contractno,
        delorcoll,
        retstocklocn,
        quantity
     INTO #delivery
     FROM
        delivery d
     where
        CONVERT(Date, d.datedel) between @dateFrom and @dateTo
        and d.delorcoll != 'D'
        and d.delorcoll != ' '
        and d.contractno!= ''

    SELECT
        WarrantyCostPrice, ItemPrice, WarrantyRetailPrice, case when WarrantyType='E' then 'EW' else 'IR' end as WarrantyType,
        CustomerAccount, ItemId, WarrantyGroupId, WarrantyContractNo, WarrantyId, EffectiveDate, SaleBranch, WarrantyDeliveredOn,
        ItemDeliveredOn, ItemNumber, ItemDescription, WarrantyNumber, SoldById, SoldBy
    INTO #WarrantySale
    FROM
        warranty.WarrantySale ws
        inner join #delivery d
            on d.contractno = ws.WarrantyContractNo
    where 
		isnull(WarrantyType, 'E') != 'F'


    ;WITH WarrantyReturnPCent(WarrantyContractNo, WarrantyId, PercentageReturn) AS
    (   -- Select the Return % used. Take the highest elapsed months after
        -- number of months elapsed if one doesn't exist for the elapsed months on the account
        select 
			ws.WarrantyContractNo, 
			ws.WarrantyId, 
			max(wr.PercentageReturn) as PercentageReturn
        from 
			warranty.WarrantyReturn wr
			inner join 
			(
				SELECT w.Id, w.Number, w.[Description], w.[Length], t.Name AS [Tag]
				FROM 
					Warranty.Warranty w
					INNER JOIN Warranty.WarrantyTags wt
						ON w.Id = wt.WarrantyId
					INNER JOIN Warranty.Tag t
					ON wt.TagId = t.Id
			) WarrantyInfo
				on wr.WarrantyLength = WarrantyInfo.[Length]
				AND 
				(
					wr.WarrantyId = WarrantyInfo.Id
					OR wr.Level_1 = CASE
										WHEN WarrantyInfo.Tag = 'Electrical' THEN 'PCE'
										WHEN WarrantyInfo.Tag = 'Furniture' THEN 'PCF'
										ELSE NULL
									END
				)
			inner join #WarrantySale ws
				on WarrantyInfo.Id = ws.WarrantyId
			inner join #delivery d
				on d.contractno = ws.WarrantyContractNo
        where
            CONVERT(Date, d.datedel) between @dateFrom and @dateTo
			-- the elapsed months must be done with item delivered on date, because
			-- the business uses them to calculate sales commissions to employees
            and wr.ElapsedMonths >= DATEDIFF(month, ws.ItemDeliveredOn, d.datedel)
        group by 
			ws.WarrantyContractNo, ws.WarrantyId
    )
	,Results_CTE AS
    (
		SELECT DISTINCT
			ROW_NUMBER() OVER (ORDER BY CONVERT(VARCHAR(10), d.datedel ,103)) AS RowNo,
			Count(1) over () AS TotalCount,
			'D' as RowType,
			CONVERT(VARCHAR(10), ws.WarrantyDeliveredOn, 103) as [Warranty Delivery Date],
			CONVERT(VARCHAR(10), ws.ItemDeliveredOn, 103) as [Product Delivery Date],
			CONVERT(VARCHAR(10), d.datedel ,103) as [Cancellation/Repossession Date],
			b.branchname as [Branch Name],
			ws.CustomerAccount as [Account Number],
			ws.WarrantyContractNo as [Contract Number],
			ws.ItemNumber as [Product Code],
			ws.ItemDescription as [Product Description],
			ws.WarrantyNumber as [Warranty Code],
			d.retstocklocn as [Warranty Return Location],
			w.[Description] as [Warranty Description],
			case
				when a.accttype = 'C' then 'Cash'
				else 'Credit'
			end as [Account Type],
			si.category as [Product Category],
			ws.SoldById as [Sales Person Username],
			ws.SoldBy as [Sales Person Name],
			case -- the elapsed months must be done with item delivered on date, because
			    --- the business uses them to calculate sales commissions to employees
				when DATEDIFF(month, ws.ItemDeliveredOn, d.datedel) <= 0 then 100
				else COALESCE(wr.PercentageReturn, 0)
			end as [Warranty Return %],
			case
				when b.StoreType = 'C' then 'Courts'
				else 'Non-Courts'
			end as [Fascia],
			case
				when d.delorcoll = 'C' then 'Cancellation'
				when d.delorcoll = 'R' then 'Repossession'
			end as [Return Type],
			CASE
				WHEN ws.WarrantyType = 'EW' THEN 'Extended'
				ELSE 'Instant Replacement'
			END as [Warranty Type],
			case -- the elapsed months must be done with item delivered on date, because
			    --- the business uses them to calculate sales commissions to employees
				when DATEDIFF(month, ws.ItemDeliveredOn, d.datedel) <= 0 then cast(ws.WarrantyRetailPrice as decimal (11,2))
				when isnull(wr.PercentageReturn,0) > 0
                    then cast(ws.WarrantyRetailPrice - round(ws.WarrantyRetailPrice *
                        ((100 - wr.PercentageReturn)/100.00),2) as decimal(11,2))
			end as [Warranty Return Value],
			cast(round(ws.ItemPrice,2) as decimal(11,2)) as [Product Value],
			cast(round(ws.WarrantyRetailPrice,2) as decimal(11,2)) as [Warranty Retail Value],
			cast(round(ws.WarrantyCostPrice,2) as decimal (11,2)) as [Warranty Cost Price],
			case
				when isnull(wr.PercentageReturn,0) = 0 then cast(ws.WarrantyRetailPrice as decimal (11,2))
				when isnull(wr.PercentageReturn,0) > 0 then cast(round(ws.WarrantyRetailPrice *
															((100 - wr.PercentageReturn)/100.00),2) as decimal(11,2))
			end as [Customer Debit Amount]
		FROM 
			#WarrantySale ws
			INNER JOIN warranty.Warranty w
				on ws.WarrantyId = w.Id
			INNER JOIN branch b
				on ws.SaleBranch = b.branchno
			INNER JOIN stockinfo si
				on ws.ItemId = si.Id
			INNER JOIN #delivery d
				on ws.WarrantyContractNo = d.contractno
			LEFT JOIN WarrantyReturnPCent wr
				on wr.WarrantyId = ws.WarrantyId
				and wr.WarrantyContractNo = ws.WarrantyContractNo
			INNER JOIN acct a
				ON ws.CustomerAccount = a.acctno
		WHERE ws.WarrantyContractNo is not null
			AND CONVERT(Date, d.datedel) between @dateFrom and @dateTo
			AND (
				d.delorcoll = CASE
						WHEN ISNULL(@returnType, 'A') = 'A' THEN d.delorcoll
						ELSE @returnType
					END
				AND d.delorcoll in ('C', 'R')
				AND d.quantity < 0
			)
			AND b.StoreType = CASE
					WHEN ISNULL(@fascia, 'A') = 'A' THEN b.StoreType
					ELSE @fascia
				END
			AND b.branchno = CASE
					WHEN @branch IS NULL THEN b.branchno
					ELSE @branch
				END
			AND ws.WarrantyType = CASE
					WHEN ISNULL(@warrantyType, 'B') = 'B' THEN ws.WarrantyType
					ELSE @warrantyType
				END
	)
	SELECT 
		RowNo,
		TotalCount,
		[Warranty Delivery Date], [Product Delivery Date], [Cancellation/Repossession Date], [Branch Name], [Account Number], [Contract Number],
        [Product Code], [Product Description], [Warranty Code], [Warranty Return Location], [Warranty Description], [Account Type],
        [Product Category], [Sales Person Username], [Sales Person Name], [Warranty Return %], [Fascia], [Return Type], [Warranty Type], [Warranty Return Value],
        [Product Value], [Warranty Retail Value], [Warranty Cost Price], [Customer Debit Amount]
	FROM 
		Results_CTE
	WHERE 
		RowNo > @FirstRec 
		AND RowNo < @LastRec
	UNION
	SELECT 
		@LastRec AS RowNo,
		null,
		'Totals','','','','','','','','',null,'','',null,null,'',null,'','','',
        sum([Warranty Return Value]), sum([Product Value]), sum([Warranty Retail Value]),
        sum([Warranty Cost Price]), sum([Customer Debit Amount])
    FROM 
		Results_CTE
	ORDER BY 
		RowNo, 
		[Cancellation/Repossession Date]