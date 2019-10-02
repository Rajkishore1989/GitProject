IF OBJECT_ID('Report.ReplacementData') IS NOT NULL
	DROP PROCEDURE Report.ReplacementData
GO 

CREATE PROCEDURE Report.ReplacementData

	@DateFrom			Date,
	@DateTo				Date,
	@Supplier			VarChar(100) = NULL,
	@WarrantyType		CHAR(1) = NULL,
	@ExchangeReason		VarChar(100) = NULL,
	@IsGrtProcessed		Int /*1 No, 2 Yes, 3 All*/
AS
	SET NOCOUNT ON
	
	;WITH ExchangeData as
	(
		select
			AcctNo,
			ItemId, 
			StockLocn,
			ContractNo,
			ExchangeDate,
			ExchangedBy,
			sp.CostPrice
		from 
			Exchange e
			inner join StockInfo si 
				on e.ReplacementItemId = si.Id
			inner join StockPrice sp 
				on si.Id = sp.Id 
				and sp.branchno = e.StockLocn
		where 
			e.CollectionType = 'R'									--Indicated Identical Replacement
			and e.ReplacementItemId is not null
	),
	ReplacementData([Date SR Resolved], [GRT Completed Date],[Date Delivered], [Date SR Logged], [Service Request Id], [Supplier Name], [Warranty Contract Number], [Charge To],
							[Product Code], [Item Id], [Product Stock Location], [Product Description], [Cost Price], [Account Number], [Sale Price], [Serial Number], [SR Resolution], [Reason For Exchange],
							[Replacement Authorised By],
							[Warranty Type], HasGrt) as

	(
		SELECT 
			sr.ResolutionDate,
			convert(varchar,e.ExchangeDate,103) as [GRT Completed Date],
			sr.ItemDeliveredOn, 
			sr.CreatedOn,
			sr.Id,
			case 
				when sr.ResolutionPrimaryCharge = 'Supplier' then sr.ResolutionSupplierToCharge
				else 'N/A' 
			end,
			ws.WarrantyContractNo,
			case 
				when sr.ResolutionPrimaryCharge = 'Unicomer Warranty' then 'FYW' 
				else sr.ResolutionPrimaryCharge
			end,
			sr.ItemNumber,
			sr.ItemId,
			sr.ItemStockLocation,
			sr.Item,
			e.CostPrice,
			sr.Account,
			sr.ItemAmount,
			sr.ItemSerialNumber,
			sr.Resolution,
			sr.ReasonForExchange,
			e.ExchangedBy,
			ws.WarrantyType,
			CASE 
				WHEN e.AcctNo IS NULL THEN 1
				ELSE 2
			END AS HasGrt
		FROM 
			Service.Request sr
			LEFT JOIN Warranty.WarrantySale ws 
				ON sr.Account = ws.CustomerAccount
				AND ws.ItemId = sr.ItemId
				AND ws.StockLocation = sr.ItemStockLocation
				AND CONVERT(DATE, sr.CreatedOn) BETWEEN ws.EffectiveDate AND DATEADD(MONTH, ws.WarrantyLength, ws.EffectiveDate)
			LEFT JOIN ExchangeData e 
				on sr.Account = e.AcctNo
				and sr.ItemId = e.ItemID
				and sr.ItemStockLocation = e.StockLocn
		WHERE 
			sr.ReplacementIssued = 1
			AND sr.FinaliseReturnDate >= @DateFrom and sr.FinaliseReturnDate <= @DateTo	
			and ISNULL(sr.Manufacturer, '') = CASE 
												WHEN @Supplier IS NULL THEN ISNULL(sr.Manufacturer, '')
												ELSE @Supplier
											  END
			and ISNULL(sr.ReasonForExchange,'') = CASE
													WHEN @ExchangeReason IS NULL THEN ISNULL(sr.ReasonForExchange,'')
													ELSE @ExchangeReason
												  END
			and ISNULL(ws.WarrantyType, '') = CASE
												WHEN @WarrantyType IS NULL THEN ISNULL(ws.WarrantyType, '')
												ELSE @WarrantyType
											  END
			and (sr.CreatedOn >= ws.EffectiveDate and sr.CreatedOn <= dateadd(month, ws.WarrantyLength, ws.EffectiveDate)  OR (e.ExchangeDate IS NULL AND @IsGrtProcessed & 1 = 1))
			and (ws.Status = 'Redeemed' OR (e.ExchangeDate IS NULL AND @IsGrtProcessed & 1 = 1))
	),
	ServicePreviousRepairs as
	(
		select 
			rd.[Service Request Id]
		from 
			ReplacementData rd inner join service.Charge sc on rd.[Service Request Id] = sc.RequestId
		where 
			sc.Type = 'EW'
			and value != 0
			and label not in ('Labour and Additional', 'Additional', 'Labour')
			and exists 
			(
				SELECT 1 
				FROM ReplacementData rd1
				WHERE 
					rd1.[Account Number] = rd.[Account Number]
					and rd1.[Date SR Logged] > rd.[Date SR Logged]
					and rd1.[Item Id] = rd.[Item Id]
					and rd1.[Product Stock Location] = rd.[Product Stock Location]
					and rd1.[SR Resolution] = 'Beyond Economic Repair')
	),
	ServiceCharge as
	(
		select 
			Type,
			sum(value) as ChargeAmount
		from 
			Service.Charge sc 
			inner join ReplacementData rd 
				on sc.RequestId = rd.[Service Request Id]
		where 
			label not in ('Labour and Additional', 'Additional', 'Labour')
			and not exists
			(
				select 1
				from ServicePreviousRepairs sp
				where sp.[Service Request Id] = sc.RequestId)
		group by  Type
	),
	ServiceChargeTotal as
	(
		select 
			sum(value) as ChargeTotal
		from 
			Service.Charge sc 
			inner join ReplacementData rd 
				on sc.RequestId = rd.[Service Request Id]
		where 
			label not in ('Labour and Additional', 'Additional', 'Labour')
			and not exists
			(
				select 1 
				from ServicePreviousRepairs sp
				where sp.[Service Request Id] = sc.RequestId)
	),
	ChargeToExchanges as
	(
		select [Charge To] as Type, count(*) as ChargeCount
		from ReplacementData
		group by [Charge To]
	)
	select 
		convert(varchar,rd.[Date SR Resolved],103) as [Date SR Resolved],
		convert(varchar,rd.[GRT Completed Date],103) as [GRT Completed Date],
		convert(varchar,rd.[Date Delivered],103) as [Date Delivered],
		convert(varchar,rd.[Date SR Logged],103) as [Date SR Logged],
		rd.[Service Request Id],
		rd.[Supplier Name],
		rd.[Warranty Contract Number],
		rd.[Charge To],
		rd.[Product Code],
		rd.[Product Description],
		cast(round(rd.[Cost Price],2) as decimal (11,2)) as [Cost Price],
		rd.[Account Number],
		cast(Round(rd.[Sale Price],2) as decimal (11,2)) as [Sale Price],
		rd.[Serial Number],
		rd.[SR Resolution],
		rd.[Reason For Exchange],
		rd.[Replacement Authorised By],
		cast(round(isnull((select ChargeAmount from ServiceCharge where Type = 'FYW'),0),2) as decimal (11,2)) as [Remove FYW Charge],
		cast(round(isnull((select ChargeAmount from ServiceCharge where Type = 'Supplier'),0),2) as decimal (11,2)) as [Remove Supplier Charge],
		cast(round(isnull((select ChargeAmount from ServiceCharge where Type = 'EW'),0),2) as decimal (11,2)) as [Remove EW Charge],
		cast(round(isnull((select ChargeAmount from ServiceCharge where Type = 'Internal'),0),2) as decimal (11,2)) as [Remove Internal Charge],
		cast(round(isnull((select ChargeTotal from ServiceChargeTotal),0),2) as decimal (11,2)) as [Remove Total Charges],
		isnull((select ChargeCount from ChargeToExchanges where Type = 'FYW'),0) as [Remove FYW Exchange Count],
		isnull((select ChargeCount from ChargeToExchanges where Type = 'Supplier'),0) as [Remove Supplier Exchange Count],
		isnull((select ChargeCount from ChargeToExchanges where Type = 'EW'),0) as [Remove EW Exchange Count],
		isnull((select ChargeCount from ChargeToExchanges where Type = 'Internal'),0) as [Remove Internal Exchange Count],
		isnull((select sum(ChargeCount) from ChargeToExchanges),0) as [Remove Total Exchanges]
	from 
		ReplacementData rd
	WHERE
		@IsGrtProcessed & HasGrt = HasGrt
