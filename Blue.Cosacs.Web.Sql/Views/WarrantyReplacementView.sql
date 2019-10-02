IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[WarrantyReplacementView]'))
	DROP VIEW [dbo].[WarrantyReplacementView]
GO

CREATE VIEW [dbo].[WarrantyReplacementView] 
AS 

select e.acctno,
	   e.agrmtno,
	   e.ItemID,
	   e.stocklocn,
	   e.contractno,
	   e.CollectionType,
	   e.ExchangeDate,
	case 
		when wf.WarrantyNumber is null then cast(round(ws.WarrantyLength-(datediff(day,ws.EffectiveDate,e.ExchangeDate)/30.00),0) as int)
	else cast(round(case when ws.WarrantyLength-(datediff(day,ws.EffectiveDate,e.ExchangeDate)/30.00)>cm.value/100.00 * wf.WarrantyLength then ws.WarrantyLength-(datediff(day,ws.EffectiveDate,e.ExchangeDate)/30.00)
			else cm.value/100.00 * wf.WarrantyLength end,0) as int) end as ReplaceWarrantyLength,
	   ws.WarrantyType,
	   isnull(e.LinkIrwId,0) as LinkIrwId,				-- #18437
	   isnull(e.LinkIrwContractno,'') as LinkIrwContractno,     -- #18437
	   isnull(e.ReplacementItemId,isnull(le.ParentItemID,0)) as ReplacementItemId,
	   isnull(l.contractno, isnull(le.contractno,'')) as ReLinkContractNo
	from Exchange e inner join warranty.WarrantySale ws 
			on e.acctno=ws.CustomerAccount 
			and ws.AgreementNumber = e.AgrmtNo
			and e.itemid=ws.itemid and e.StockLocn=ws.StockLocation and e.ContractNo=ws.WarrantyContractNo
	left join warranty.WarrantySale wf on e.acctno=wf.CustomerAccount 
	and wf.AgreementNumber = e.AgrmtNo 
	and e.itemid=wf.itemid and e.StockLocn=wf.StockLocation and e.WarrantyGroupId = wf.WarrantyGroupId and wf.WarrantyType = 'F'
	and wf.[status]!='Redeemed'			-- #18437
	left join lineitem l on l.acctno = e.acctno 
		and l.agrmtno = e.AgrmtNo
		and l.ParentItemID = e.ReplacementItemId
		and l.stocklocn = e.StockLocn
		and exists(select * from warranty.WarrantySale linkChanged
						where linkChanged.CustomerAccount = l.acctno
						and linkChanged.AgreementNumber = e.AgrmtNo
						and linkChanged.ItemId != l.ParentItemID
						and linkChanged.WarrantyContractNo = l.ContractNo)
	left join lineitem le on le.acctno = e.acctno
	and le.agrmtno = e.AgrmtNo
	and le.stocklocn = e.StockLocn
	and le.contractno = e.LinkIrwContractno
	and exists(select * from warranty.WarrantySale linkChangedExchange
				where linkChangedExchange.CustomerAccount = le.acctno
				and linkChangedExchange.AgreementNumber = le.agrmtno
				and linkChangedExchange.WarrantyContractNo = le.contractno
				and linkChangedExchange.ItemId != le.ParentItemID),
	CountryMaintenance cm
	
where cm.codename='MinFreeMonthIR'









