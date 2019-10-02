IF OBJECT_ID('Report.ServiceClaims') IS NOT NULL
	DROP PROCEDURE Report.ServiceClaims
GO 

CREATE PROCEDURE Report.ServiceClaims
	@DateLoggedFrom				varchar(10),
	@DateLoggedTo				varchar(10),
	@DateResolvedFrom			varchar(10),
	@DateResolvedTo				varchar(10),
	@Supplier					VarChar(100) = '',
	@PrimaryCharge				VarChar(30) = '',
	@Department					Int = NULL,
	@IncludeTechnicianReport	bit, 
	@SupplierCharged			bit, 
	@FYWCharged					bit, 
	@EWCharged					bit, 
	@PageNumber					SmallInt,
	@PageSize					SmallInt
	
AS
	SET NOCOUNT ON

	Declare @TotalRowCount Int

	SET @DateLoggedFrom = Cast(@DateLoggedFrom as Date)
	SET @DateLoggedTo = Cast(@DateLoggedTo as Date)
	SET @DateResolvedFrom = Cast(@DateResolvedFrom as Date)
	SET @DateResolvedTo = Cast(@DateResolvedTo as Date)

	select 
		r.Id as [Request Id]
	into #ServiceHistory
	from 
		Service.Request r
	inner join 
		Service.HistoryView h on r.Id = h.RequestId
			
	where 
		h.Id != h.RequestId
		and cast(h.CreatedOn as date) >= dateadd(d, -90, cast(r.CreatedOn as date))
		and r.ResolutionDate >= @DateResolvedFrom and r.ResolutionDate <= @DateResolvedTo
		and cast(r.CreatedOn as date) >= @DateLoggedFrom and cast(r.CreatedOn as date) <=  @DateLoggedTo
	group by r.Id

	;WITH ServiceChargeParts as
	(
		select 
			RequestId,
			isnull((select sum(cfyw.value) from service.charge cfyw
					where cfyw.type = 'FYW' and cfyw.RequestId = c.RequestId
					and cfyw.Label in ('Parts Cosacs', 'Parts External', 'Parts Other', 'Parts Salvaged')
					and cfyw.value > 0),0) as  [FYW Parts Charge],
		
			isnull((select sum(cew.value) from service.Charge cew
					where cew.Type = 'EW' and cew.RequestId = c.RequestId
					and cew.Label in ('Parts Cosacs', 'Parts External', 'Parts Other', 'Parts Salvaged')
					and cew.value > 0),0) as [EW Parts Charge],

			isnull((select sum(value) from service.Charge csup
					where csup.Type = 'Supplier' and csup.RequestId = c.RequestId
					and csup.Label in ('Parts Cosacs', 'Parts External', 'Parts Other', 'Parts Salvaged')
					and csup.value > 0),0) as  [Supplier Parts Charge]
		from 
			Service.Charge c
		where 
			type in ('EW', 'FYW', 'Supplier')
			and value > 0
			and label in ('Parts Cosacs', 'Parts External', 'Parts Other', 'Parts Salvaged')
		group by RequestId
	),
	ServiceChargeLabour as
	(
		select 
			RequestId,
			isnull((select sum(cfyw.value) from service.charge cfyw
					where cfyw.type = 'FYW' and cfyw.RequestId = c.RequestId
					and cfyw.Label in ('Labour', 'Labour and Additional')
					and cfyw.value > 0),0) as [FYW Labour Charge],
		
			isnull((select sum(cew.value) from service.Charge cew
					where cew.Type = 'EW' and cew.RequestId = c.RequestId
					and cew.Label in ('Labour', 'Labour and Additional')
					and cew.value > 0),0) as [EW Labour Charge],

			isnull((select sum(value) from service.Charge csup
					where csup.Type = 'Supplier' and csup.RequestId = c.RequestId
					and csup.Label in ('Labour', 'Labour and Additional')
					and csup.value > 0),0) as [Supplier Labour Charge]
		from 
			Service.Charge c
		where 
			type in ('EW', 'FYW', 'Supplier')
			and value > 0
			and label in ('Labour', 'Labour and Additional')
		group by 
			RequestId
	),
	ServiceChargeAdditional as
	(
		select 
			RequestId,
			isnull((select sum(cfyw.value) from service.charge cfyw
					where cfyw.type = 'FYW' and cfyw.RequestId = c.RequestId
					and cfyw.Label in ('Additional')
					and cfyw.value > 0),0) as [FYW Additional Charge],
		
			isnull((select sum(cew.value) from service.Charge cew
					where cew.Type = 'EW' and cew.RequestId = c.RequestId
					and cew.Label in ('Additional')
					and cew.value > 0),0) as [EW Additional Charge],

			isnull((select sum(value) from service.Charge csup
					where csup.Type = 'Supplier' and csup.RequestId = c.RequestId
					and csup.Label in ('Additional')
					and csup.value > 0),0) as [Supplier Additional Charge]
		from 
			Service.Charge c
		where 
			type in ('EW', 'FYW', 'Supplier')
			and value > 0
			and label in ('Additional')
		group by 
			RequestId
	),
	ServiceParts as
	(
		select 
			p.RequestId,
			sum(p.Quantity) as TotalPartQty,
			sum(p.Price) as TotalPartUnitPrice,
			sum(p.CostPrice * p.Quantity) as TotalPartCost
		from 
			service.RequestPart p
		group by
			p.RequestId
	)
	SELECT 
		country.countrycode as [CountryCode],
		r.Id as [ServiceRequestId],
		isnull(r.Manufacturer,'') as [SupplierName], 
		isnull(h.Name,'') as [ProductCategory],
		isnull(r.ResolutionPrimaryCharge,'') as [PrimaryCharge],
		convert(varchar,r.CreatedOn,103) as [DateLogged],
		convert(varchar,r.ResolutionDate,103) as DateResolved,
		convert(varchar,r.ItemDeliveredOn,103) as [DateDelivered],
		convert(varchar,a.dateacctopen, 103) as [DateAccountOpened],
		isnull(wf.Description, '') as [FYWDescription],
		w.Id AS FYWId,
		isnull(wsf.WarrantyContractNo, '') as [FYWContractNumber],
		isnull(we.Description, '') as [EWDescription],
		wse.WarrantyId AS EWId,
		isnull(wse.WarrantyContractNo, '') as [EWContractNumber],
		isnull(r.ItemModelNumber,'') as [ModelNumber], 
		isnull(r.ItemSerialNumber,'') as [SerialNumber],
		case 
			when isnull(r.ReplacementIssued,0) = 0 then 'N'
			else 'Y'
		end as [ReplacementIssued],
		case 
			when @IncludeTechnicianReport = 1 then isnull(r.ResolutionReport,'')
			else ''
		end as [TechnicianReport],
		r.CustomerFirstName + ' ' + r.CustomerLastName as [CustomerName],
		r.Account as [AccountNumber],
		isnull(r.Resolution,'') as [Resolution],
		CONVERT(DECIMAL(11, 2), COALESCE(wsf.ItemCostPrice, wse.ItemCostPrice, 0)) [OriginalProductCostPrice],
		cast(round(isnull(p.Cost,0),2) as decimal (11,2)) as [PartsCost],
		isnull(r.ItemNumber,'') as [ProductCode],
		isnull(r.item, '') as [ProductDescription],
		cast('' as varchar(50)) as [PartNumber],
		cast('' as varchar(200)) as [PartDescription],
		cast(round(isnull(PartsTot.TotalPartQty,0),2) as decimal (11,2)) as [PartQuantity],
		cast(round(isnull(PartsTot.TotalPartUnitPrice,0),2) as decimal (11,2)) as [PartUnitPrice],
		cast(round(isnull(PartsTot.TotalPartCost,0),2) as decimal(11,2)) as [PartCost],
		cast(round(isnull(partsCharge.[Supplier Parts Charge], 0),2) as decimal (11,2)) as [SupplierPartsCharge],
		cast(round(isnull(partsCharge.[FYW Parts Charge],0),2) as decimal (11,2)) as [FYWPartsCharge],
		cast(round(isnull(partsCharge.[EW Parts Charge],0),2) as decimal (11,2)) as [EWPartsCharge],
		cast(round(isnull(labourCharge.[Supplier Labour Charge],0),2) as decimal (11,2)) as [SupplierLabourCharge],
		cast(round(isnull(labourCharge.[FYW Labour Charge],0),2) as decimal (11,2)) as [FYWLabourCharge],
		cast(round(isnull(labourCharge.[EW Labour Charge],0),2) as decimal (11,2)) as [EWLabourCharge],
		cast(round(isnull(additionalCharge.[Supplier Additional Charge],0),2) as decimal (11,2)) as [SupplierAdditionalCharge],
		cast(round(isnull(additionalCharge.[FYW Additional Charge],0),2) as decimal (11,2)) as [FYWAdditionalCharge],
		cast(round(isnull(additionalCharge.[EW Additional Charge],0),2) as decimal (11,2)) as [EWAdditionalCharge],
		cast(round(isnull(fd.Value,0),0) as decimal (11,2)) as [FoodLossValue],
		cast(round(isnull(partsCharge.[Supplier Parts Charge],0) 
			+ isnull(partsCharge.[FYW Parts Charge],0) 
			+ isnull(partsCharge.[EW Parts Charge],0)
			+ isnull(labourCharge.[Supplier Labour Charge],0)
			+ isnull(labourCharge.[FYW Labour Charge],0)
			+ isnull(labourCharge.[EW Labour Charge],0)
			+ isnull(additionalCharge.[Supplier Additional Charge],0)
			+ isnull(additionalCharge.[FYW Additional Charge],0)
			+ isnull(additionalCharge.[EW Additional Charge],0)
			+ isnull(fd.Value,0),2) as decimal (11,2)) as [TotalCharge],
		case 
			when sh.[Request Id] is null then 'N' 
			else 'Y' 
		end	as [PreviousRepairsWithin90Days]
	INTO #claims 
	FROM
		Service.Request r
		LEFT JOIN acct a 
			on r.Account = a.acctno 
		LEFT JOIN Merchandising.HierarchyTag h
			ON h.Id = r.ProductLevel_2
		LEFT JOIN Warranty.WarrantySale wsf										
			ON r.Account = wsf.CustomerAccount
			and r.ItemId = wsf.ItemId
			and r.ManufacturerWarrantyContractNo = wsf.WarrantyContractNo		
		LEFT JOIN Warranty.Warranty wf 
			ON wf.Number = wsf.WarrantyNumber
		LEFT JOIN Warranty.WarrantySale wse
			ON r.Account = wse.CustomerAccount
			and r.ItemId = wse.ItemId
			and r.WarrantyContractNo = wse.WarrantyContractNo
		LEFT JOIN Warranty.Warranty we
			ON we.Number = wse.WarrantyNumber
		LEFT JOIN 
		(
			SELECT SUM(Quantity * CostPrice) AS Cost, RequestId FROM Service.RequestPart GROUP BY RequestId
		) p
			ON r.id = p.RequestId
		LEFT JOIN ServiceChargeParts partsCharge on partsCharge.RequestId = r.Id
		LEFT JOIN ServiceChargeLabour labourCharge on labourCharge.RequestId = r.Id
		LEFT JOIN ServiceChargeAdditional additionalCharge on additionalCharge.RequestId = r.Id
		LEFT JOIN 
		(
			SELECT SUM(Value) AS Value, RequestId FROM Service.RequestFoodLoss GROUP BY RequestId
		) fd
			ON r.Id = fd.RequestId
		LEFT JOIN #ServiceHistory sh ON sh.[Request Id] = r.Id
		LEFT JOIN Warranty.Warranty w 
			ON wsf.WarrantyNumber = w.Number
		LEFT JOIN ServiceParts PartsTot ON PartsTot.RequestId = r.Id	
		CROSS JOIN Country
	WHERE
		r.ResolutionDate >= @DateResolvedFrom and r.ResolutionDate <= @DateResolvedTo
		AND cast(r.CreatedOn as date) >= @DateLoggedFrom and cast(r.CreatedOn as date) <=  @DateLoggedTo
		AND ISNULL(r.Manufacturer, '') = CASE 
											WHEN @Supplier = '' THEN ISNULL(r.Manufacturer, '')
											ELSE @Supplier
											END
		AND ISNULL(r.ResolutionPrimaryCharge, '') = CASE 
											WHEN @PrimaryCharge = '' THEN ISNULL(r.ResolutionPrimaryCharge, '')
											ELSE CASE 
													WHEN @PrimaryCharge = 'FYW' THEN 'Unicomer Warranty' 
													ELSE @PrimaryCharge 
													END
											END
		AND ISNULL(r.ProductLevel_1, -1) = CASE	
											WHEN NULLIF(@Department, '') IS NULL THEN ISNULL(r.ProductLevel_1, -1)
											ELSE @Department
										END
		AND (
				(@FYWCharged = 1 
					and (partsCharge.[FYW Parts Charge] > 0 or
					labourCharge.[FYW Labour Charge] > 0 or
					additionalCharge.[FYW Additional Charge] > 0))
					or
				(@SupplierCharged = 1 
					and (partsCharge.[Supplier Parts Charge] > 0 or
					labourCharge.[Supplier Labour Charge] > 0 or
					additionalCharge.[Supplier Additional Charge] > 0)) 
					or
				(@EWCharged = 1 
					and (partsCharge.[EW Parts Charge] > 0 or
					labourCharge.[EW Labour Charge] > 0 or
					additionalCharge.[EW Additional Charge] > 0)) 
			)

	INSERT INTO 
		#claims
	SELECT
		'', r.Id, '', '', '', 
		convert(varchar,r.CreatedOn,103) as [DateLogged], --6
		convert(varchar,r.ResolutionDate,103) as DateResolved, --7
		'', 
		convert(varchar,a.dateacctopen, 103) as [DateAccountOpened], --9
		isnull(wf.Description,''), 
		wsf.WarrantyId AS FYWId,
		'' as [FYWContractNumber], --12
		isnull(we.Description,''), NULL, '', '', '', '', '', '', '', '', 0, 0, 
		isnull(r.ItemNumber,'') as [ProductCode], --25
		isnull(r.item, '') as [ProductDescription],
		isnull(sp.PartNumber,''),
		isnull(sp.Description,''),
		sp.Quantity,
		isnull(sp.Price,0),
		isnull(sp.CostPrice * sp.Quantity,0),
		0,0,0,0,0,0,0,0,0,0,0,'' 
	FROM 
		Service.Request r
		INNER JOIN 
			#claims c on r.id = c.ServiceRequestId
		INNER JOIN 
			Service.RequestPart sp ON sp.RequestId = r.Id
		LEFT JOIN Warranty.WarrantySale wsf	
			ON r.Account = wsf.CustomerAccount
			and r.ItemId = wsf.ItemId
			and r.ManufacturerWarrantyContractNo = wsf.WarrantyContractNo
		LEFT JOIN Warranty.Warranty wf
			ON wf.Number = wsf.WarrantyNumber
		LEFT JOIN Warranty.WarrantySale wse											
			ON r.Account = wse.CustomerAccount
			and r.ItemId = wse.ItemId
			and r.WarrantyContractNo = wse.WarrantyContractNo
		LEFT JOIN Warranty.Warranty we
			ON we.Number = wse.WarrantyNumber		
		INNER JOIN acct a on r.Account = a.acctno 

	SELECT @TotalRowCount = COUNT(*) FROM #claims

	;WITH ServiceComments(id, Text, RowNumber, RecordCount) AS
	(
		SELECT  
			RequestId id, 
			REPLACE(REPLACE(text, CHAR(13), ''), CHAR(10), '') AS Text,
			ROW_NUMBER() OVER (PARTITION BY RequestId ORDER BY id) AS RowNumber,
			COUNT(*) OVER (PARTITION BY RequestId) AS RecordCount
		FROM    
			Service.Comment c
		WHERE
			c.RequestId IN 
			(
				SELECT ServiceRequestId 
				FROM #claims
			)
	)
	,ServiceCommentsConcat (id, Text, AllText, RowNumber, RecordCount) AS
	(
		SELECT  
			id, 
			text,
			CAST(Text AS VARCHAR(MAX)) AllText, 
			RowNumber, 
			RecordCount
		FROM    
			ServiceComments
		WHERE   
			RowNumber = 1
		UNION ALL
		SELECT  
			sc.id, 
			sc.text,
			CAST(scc.AllText + '. ' + sc.text AS VARCHAR(MAX)),
			sc.RowNumber, 
			sc.RecordCount
		FROM    
			ServiceCommentsConcat scc
			JOIN ServiceComments sc
				ON sc.id = scc.id
				AND sc.RowNumber = scc.RowNumber + 1
	)
	SELECT
		CountryCode, ServiceRequestId, SupplierName, ProductCategory, PrimaryCharge, DateLogged, DateResolved, DateDelivered, DateAccountOpened, FYWDescription, FYWId, FYWContractNumber, EWDescription, EWId, EWContractNumber, ModelNumber, SerialNumber, ReplacementIssued, 
		REPLACE(REPLACE(TechnicianReport, CHAR(13), ''), CHAR(10), '') AS TechnicianReport,
		cm.AllText AS Comments,
		CustomerName, AccountNumber, Resolution, OriginalProductCostPrice, PartsCost, ProductCode, ProductDescription, PartNumber, PartDescription, PartQuantity, PartUnitPrice, PartCost, SupplierPartsCharge, FYWPartsCharge, EWPartsCharge, SupplierLabourCharge, FYWLabourCharge, EWLabourCharge, SupplierAdditionalCharge, FYWAdditionalCharge, EWAdditionalCharge, FoodLossValue, TotalCharge, PreviousRepairsWithin90Days, TotalRows
	FROM 
		(
			SELECT 
				* , ROW_NUMBER() OVER(ORDER BY ServiceRequestId, CountryCode Desc, SupplierName, ProductCategory, PrimaryCharge, DateLogged) AS RowNumber, @TotalRowCount AS TotalRows
			FROM 
				#claims
		) Data
		LEFT JOIN
		(
			SELECT scc.id, scc.AllText
			FROM ServiceCommentsConcat scc
			WHERE scc.RowNumber = scc.RecordCount
		) AS cm
			ON  Data.ServiceRequestId = cm.id
	WHERE
		RowNumber BETWEEN (@PageNumber - 1 ) * @PageSize AND @PageNumber * @PageSize 
	ORDER BY 
		ServiceRequestId, CountryCode Desc, SupplierName, ProductCategory, PrimaryCharge, DateLogged

