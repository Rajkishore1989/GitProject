IF EXISTS (SELECT * FROM dbo.sysobjects
WHERE id = OBJECT_ID('[Report].[ServiceIncomeAnalysis]') AND OBJECTPROPERTY(id,'IsProcedure') = 1)
    DROP PROCEDURE [Report].[ServiceIncomeAnalysis]
GO

CREATE PROCEDURE [Report].[ServiceIncomeAnalysis]
    @Period char(3),
    @Year int,
    @Month smallint,
    @DateFrom date=null,
    @DateTo date=null
AS

    declare @StartDate date, @EndDate date, @RunNoStart int, @RunNoEnd int

    if @Period = 'MTD'
    Begin
        SELECT @StartDate = min(StartDate), @endDate = max(EndDate)
        FROM FinancialWeeks where FinYear = @Year and FinMonth = @month
    End
    else
    Begin
        SELECT @StartDate = min(StartDate) from FinancialWeeks where FinYear=@Year
        select @endDate = max(EndDate) from FinancialWeeks where FinYear=@Year and FinMonth=@Month
    End

    select @RunNoStart = Min(RunNo) from InterfaceControl i where Interface='FIN.TRAN' and DateStart>=@StartDate
    select @RunNoEnd = Max(RunNo) from InterfaceControl i where Interface='FIN.TRAN' and DateStart<=@EndDate
    -- get report categories

    -- INCOME
    select
        case
            when code in (8,22,24,25) then 29
            when code in (82,84,85) then 89
            else code
        end as code,
        case
            when code<50 then 'PCE'
            else 'PCF'
        end as PG,
        case
            when code in (1,2,3,4,5,6,21) then codedescript
            when code in (8,22,24,25) then 'Other'
            when code in (82,84,85) then 'Other'
            when code in (50,60,70,75,80,81) then codedescript
        else 'Other'
        end as [Category],
        cast(0 as decimal(15,2)) as EW,     -- Ext War
        cast(0 as decimal(15,2)) as Cust,   -- Customer
        cast(0 as decimal(15,2)) as Supp,   -- Supplier
        cast(0 as decimal(15,2)) as FYW,    -- FYW
        cast(0 as decimal(15,2)) as Inter,  -- Internal
        cast(0 as decimal(15,2)) as Other   -- Other
    into #report_income
    from
        code
    where
        category in ('PCE','PCF','PCW')
        and code in (1,2,3,4,5,6,21,50,60,70,75,80,81,8,22,24,25,82,84,85)
    group by
        case
            when code in (8,22,24,25) then 29
            when code in (82,84,85) then 89 else code
        end,
        case
            when code<50 then 'PCE' else 'PCF'
        end,
        case
            when code in (1,2,3,4,5,6,21) then codedescript
            when code in (8,22,24,25) then 'Other'
            when code in (82,84,85) then 'Other'
            when code in (50,60,70,75,80,81) then codedescript
            else 'Other'
        end
    order by
        case
            when code<50 then 'PCE'
            else 'PCF'
        end, cast(
        case
            when code in (8,22,24,25) then 29
            when code in (82,84,85) then 89
            else code
        end as int)


    -- COSTS
    select
        case
            when code in (8,22,24,25) then 29
            when code in (82,84,85) then 89
            else code
        end as code,
        case
            when code<50 then 'PCE'
            else 'PCF'
        end as PG,
        case
            when code in (1,2,3,4,5,6,21) then codedescript
            when code in (8,22,24,25) then 'Other'
            when code in (82,84,85) then 'Other'
            when code in (50,60,70,75,80,81) then codedescript
            else 'Other'
        end as [Category],
        cast(0 as decimal(15,2)) as EW,     -- Ext War
        cast(0 as decimal(15,2)) as Cust,   -- Customer
        cast(0 as decimal(15,2)) as Supp,   -- Supplier
        cast(0 as decimal(15,2)) as FYW,    -- FYW
        cast(0 as decimal(15,2)) as Inter,  -- Internal
        cast(0 as decimal(15,2)) as Other   -- Other
    into #report_costs
    from
        code
    where
        category in ('PCE','PCF','PCW')
        and code in (1,2,3,4,5,6,21,50,60,70,75,80,81,8,22,24,25,82,84,85)
    group by
        case
            when code in (8,22,24,25) then 29
            when code in (82,84,85) then 89
            else code
        end,
        case
            when code<50 then 'PCE'
            else 'PCF'
        end,
        case
            when code in (1,2,3,4,5,6,21) then codedescript
            when code in (8,22,24,25) then 'Other'
            when code in (82,84,85) then 'Other'
            when code in (50,60,70,75,80,81) then codedescript
        else 'Other'
    end

    order by
        case
            when code<50 then 'PCE' else 'PCF'
        end,
        cast(
            case
                when code in (8,22,24,25) then 29
                when code in (82,84,85) then 89
                else code
            end as int)


    --Saves the original value  - required  DO NOT REMOVE!!
    DECLARE @ArithabortState Int = 64 & @@OPTIONS
    SET ARITHABORT ON               -- required!!

    ;WITH XMLNAMESPACES(default 'http://www.bluebridgeltd.com/cosacs/2012/schema.xsd'),
    Data(SRno, MessageId) AS
    (
        SELECT c.value('/ServiceDetail[1]/ServiceRequestNo[1]', 'int'), services.Id
        FROM (
            select body AS XMLMessage, id from hub.Message m where m.routing = 'Cosacs.Service.Detail'
        ) AS services
        CROSS APPLY services.XMLMessage.nodes('/ServiceDetail') AS SR(c)
    )
    SELECT distinct 
        SRno,sr.ProductLevel_1, sr.ProductLevel_2, data.MessageId
    into #srdets
    FROM 
        data 
    INNER JOIN Service.request sr
        ON sr.id=data.SRno
    inner join financial.[Transaction] f
        on data.MessageId=f.MessageId
        and isnull(f.runno,0) between @RunNoStart and @RunNoEnd
    where 
        isnull(sr.itemdeliveredon, '1900-01-01') >= isnull(@DateFrom, '1900-01-01')
        and isnull(sr.itemdeliveredon, '1900-01-01') <= isnull(@DateTo, Getdate())

    -- restore - required DO NOT REMOVE!!
    IF (@ArithabortState & 64) = 64
        SET ARITHABORT ON
    ELSE
        SET ARITHABORT OFF


    SELECT 
        CASE 
            WHEN label='Parts Cosacs' then 400
            WHEN label='Parts Salvaged' then 400 
            WHEN label='Parts External' then 410
            WHEN (label='Labour') and IsExternal=0 then 420
            WHEN (label='Labour') and IsExternal=1 then 430            
            WHEN (label='Labour and Additional') then 440    
            WHEN (label='Additional') then 430           
            ELSE 450
        end as Code,
        'XX' as PG,
        case 
            when label='Parts Cosacs' then 'Internal Parts'
            when label='Parts Salvaged' then 'Internal Parts' 
            when label='Parts External' then 'External Parts'
            when (label='Labour') and IsExternal=0 then 'Internal Labour'
            when (label='Labour') and IsExternal=1 then 'External Labour'
            when (label='Labour and Additional') then 'Internal Labour'     
            when (label='Additional') then 'External Labour'         
            else 'Other Costs'
        end as [Category],
        cast(0 as decimal(15,2)) as EW,         -- Ext War
        cast(0 as decimal(15,2)) as Cust,       -- Customer
        cast(0 as decimal(15,2)) as Supp,       -- Supplier
        cast(0 as decimal(15,2)) as FYW,        -- FYW
        cast(0 as decimal(15,2)) as Inter,      -- Internal
        cast(0 as decimal(15,2)) as Other       -- Other
    into #AnnualCosts
    from #srdets s inner join service.charge c
        on s.SRno=c.RequestId
    group by
        case
            when label='Parts Cosacs' then 400
            when label='Parts Salvaged' then 400 
            when label='Parts External' then 410
            when (label='Labour') and IsExternal=0 then 420
            when (label='Labour') and IsExternal=1 then 430            
            when (label='Labour and Additional') then 440    
            when (label='Additional') then 430           
            else 450
        end,
        case
            when label='Parts Cosacs' then 'Internal Parts'
            when label='Parts Salvaged' then 'Internal Parts' 
            when label='Parts External' then 'External Parts'
            when (label='Labour') and IsExternal=0 then 'Internal Labour'
            when (label='Labour') and IsExternal=1 then 'External Labour'
            when (label='Labour and Additional') then 'Internal Labour'     
            when (label='Additional') then 'External Labour'         
            else 'Other Costs'
        end

    -- Cost Split
    select 
        case 
            when label='Parts Cosacs' then 400
            when label='Parts Salvaged' then 400 
            when label='Parts External' then 410
            when (label='Labour') and IsExternal=0 then 420
            when (label='Labour') and IsExternal=1 then 430            
            when (label='Labour and Additional') then 440
            when (label='Additional') then 430           
            else 450 
        end as Code,
        'XX' as PG,
        case 
            when label='Parts Cosacs' then 'Internal Parts'
            when label='Parts Salvaged' then 'Internal Parts' 
            when label='Parts External' then 'External Parts'
            when (label='Labour') and IsExternal=0 then 'Internal Labour'
            when (label='Labour') and IsExternal=1 then 'External Labour'
            when (label='Labour and Additional') then 'Internal Labour'     
            when (label='Additional') then 'External Labour'         
            else 'Other Costs' 
        end as [Category],
        c.Type, 
        sum(c.cost) as TotCost
    into #costSplit
    from #srdets s
    inner join (
        SELECT
            CASE 
                WHEN c.Type = 'Internal' AND sr.Type = 'S' THEN 'Internal'
                WHEN c.Type = 'Internal' AND sr.Type != 'S' THEN 'Other'
                ELSE c.Type
            END AS [Type],
            c.label, c.IsExternal, requestid,
            CASE
                -- Show the cost normally for all SR's not BER (Beyond Economic Repair)
                WHEN sr.FinalisedFailure != 'Beyond Economic Repair' AND sr.Resolution != 'Beyond Economic Repair' THEN c.Cost

                -- For SR's marked as BER and label='Labour' also show the normal cost
                WHEN (sr.FinalisedFailure = 'Beyond Economic Repair' OR sr.Resolution = 'Beyond Economic Repair') AND c.Label IN ('Labour', 'Labour and Additional') THEN c.Cost
                
                -- For SR's marked as BER, but with other labels skip the cost (return 0)
                ELSE 0
            END AS Cost
        FROM 
            service.charge c 
        INNER JOIN Service.Request sr
            ON c.RequestId = sr.Id
    ) c
        on s.SRno=c.requestid
    group by
        case
            when label='Parts Cosacs' then 400
            when label='Parts Salvaged' then 400 
            when label='Parts External' then 410
            when (label='Labour') and IsExternal=0 then 420
            when (label='Labour') and IsExternal=1 then 430            
            when (label='Labour and Additional') then 440
            when (label='Additional') then 430           
            else 450
        end, -- Code
        case
            when label='Parts Cosacs' then 'Internal Parts'
            when label='Parts Salvaged' then 'Internal Parts' 
            when label='Parts External' then 'External Parts'
            when (label='Labour') and IsExternal=0 then 'Internal Labour'
            when (label='Labour') and IsExternal=1 then 'External Labour'
            when (label='Labour and Additional') then 'Internal Labour'     
            when (label='Additional') then 'External Labour'         
            else 'Other Costs'
        end, -- [Category]
        c.Type

    -- Cost Analysis
    update #AnnualCosts 
        set EW = EW + s.TotCost
    from #costSplit s, #AnnualCosts a
    where s.PG=a.PG
        and s.Code=a.Code
        and s.type='EW'

    update #AnnualCosts 
        set Supp = Supp + s.TotCost
    from #costSplit s, #AnnualCosts a
    where s.PG=a.PG
        and s.Code=a.Code
        and s.type='Supplier'

    update #AnnualCosts 
        set Cust = Cust + s.TotCost
    from #costSplit s, #AnnualCosts a
    where  s.PG=a.PG
        and s.Code=a.Code
        and s.type='Customer'

    update #AnnualCosts 
        set Inter = Inter + s.TotCost
    from #costSplit s, #AnnualCosts a
    where  s.PG=a.PG
        and s.Code=a.Code
        and s.type='Internal'

    update #AnnualCosts 
        set FYW = FYW + s.TotCost
    from #costSplit s, #AnnualCosts a
    where  s.PG=a.PG
        and s.Code=a.Code
        and s.type='FYW'

    update #AnnualCosts 
        set Other = Other + s.TotCost
    from #costSplit s, #AnnualCosts a
    where  s.PG=a.PG
        and s.Code=a.Code
        and s.type not in ('FYW', 'Internal', 'Customer', 'EW', 'Supplier')

    -- Workstation (PCW) grouped with Electrical (PCE)
    select
        case
            when s.ProductLevel_1='PCW' then 'PCE'
            else s.ProductLevel_1
        end as ProductLevel_1,
        s.ProductLevel_2, Type, sum(c.value+c.tax) as TotAmount, sum(c.cost) as TotCost
    into #income
    from #srdets s 
    inner join (
        SELECT
            CASE 
                WHEN c.Type = 'Internal' AND sr.Type = 'S' THEN 'Internal'
                WHEN c.Type = 'Internal' AND sr.Type != 'S' THEN 'Other'
                ELSE c.Type
            END AS [Type],
            c.label, c.IsExternal, requestid, c.value, c.Tax, c.Cost
        FROM 
            service.charge c 
        INNER JOIN Service.Request sr
            ON c.RequestId = sr.Id
            --AND sr.Type='Deliverer'
    ) c
        on s.SRno=c.requestid
    group by
        case
            when s.ProductLevel_1='PCW' then 'PCE'
            else s.ProductLevel_1
        end,
        s.ProductLevel_2, Type

    -- Income
    update #report_income
        set EW = EW + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='EW'

    update #report_income
        set Supp = Supp + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Supplier'

    update #report_income
        set Cust = Cust + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Customer'

    update #report_income
        set Inter = Inter + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Internal'

    update #report_income
        set FYW = FYW + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='FYW'

    update #report_income 
        set Other = Other + i.TotAmount
    from #income i, #report_income r
    where i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type not in ('FYW', 'Internal', 'Customer', 'EW', 'Supplier')

    -- costs
    update #report_costs
        set EW = EW + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='EW'

    update #report_costs
        set Supp = Supp + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Supplier'

    update #report_costs
        set Cust = Cust + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Customer'

    update #report_costs
        set Inter = Inter + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='Internal'

    update #report_costs
        set FYW = FYW + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type='FYW'

    update #report_costs
        set Other = Other + i.TotCost
    from #income i, #report_costs r
    where  i.ProductLevel_1=r.PG
        and i.ProductLevel_2=r.Code
        and i.type not in ('FYW', 'Internal', 'Customer', 'EW', 'Supplier')

    -- Report Income
    select 0 as [CatOrder], '' as [PgOrder], 'INCOME' as Category, null as [Extended Warranty], null as Customers,
        null as Suppliers, null as [First Year Warranty], null as [Repairs to Stock], null as [Other],
        null as [Total]
    union
    select code, PG, Category, EW as [Extended Warranty], Cust as Customers, Supp as Suppliers,
        FYW as [First Year Warranty], Inter as [Repairs to Stock], Other,
        EW + Cust + Supp + FYW + Inter + Other as [Total]
    from #report_income
    where PG='PCE'
    union
    select 48, '', 'Total' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers, sum(Supp) as Suppliers,
        sum(FYW) as [First Year Warranty],sum(Inter) as [Repairs to Stock], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_income
    where PG='PCE'
    union
    -- blank
    select 49, '', ' ' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty],null as [Repairs to Stock], null, null as [Total]
    union
    select code,PG,Category, EW as [Extended Warranty], Cust as Customers, Supp as Suppliers,
        FYW as [First Year Warranty],Inter as [Repairs to Stock], Other, EW + Cust + Supp + FYW + Inter + Other as [Total]
    from #report_income
    where PG='PCF'
    union
    select 99, '', 'Total' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers, sum(Supp) as Suppliers,
        sum(FYW) as [First Year Warranty], sum(Inter) as [Repairs to Stock], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_income
    where PG='PCF'
    union
    -- blank
    select 100, '', ' ' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Repairs to Stock], null, null as [Total]
    union
    -- Total Income
    select 101, '', 'Total Income' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers,
        sum(Supp) as Suppliers, sum(FYW) as [First Year Warranty], sum(Inter) as [Repairs to Stock], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_income
    union
    -- costs
    select 200, '', 'COSTS' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Repairs to Stock], null as [Other], null as [Total]
    union
    select code + 200, PG, Category, EW as [Extended Warranty], Cust as Customers, Supp as Suppliers,
        FYW as [First Year Warranty], Inter as [Repairs to Stock], Other, EW + Cust + Supp + FYW + Inter + Other as [Total]
    from #report_costs
    where PG='PCE'
    union
    select 248, '', 'Total' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers, sum(Supp) as Suppliers,
        sum(FYW) as [First Year Warranty], sum(Inter) as [Repairs to Stock], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_costs
    where PG='PCE'
    union
    -- blank
    select 249, '', ' ' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Repairs to Stock], null, null as [Total]
    union
    select code + 200, PG, Category, EW as [Extended Warranty], Cust as Customers, Supp as Suppliers, FYW as [First Year Warranty],
        Inter as [Repairs to Stock], Other, EW + Cust + Supp + FYW + Inter + Other as [Total]
    from #report_costs
    where PG='PCF'
    union
    select 299, '', 'Total' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers, sum(Supp) as Suppliers,
        sum(FYW) as [First Year Warranty], sum(Inter) as [Repairs to Stock], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_costs
    where PG='PCF'
    union
    -- blank
    select 300, '', ' ' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Repairs to Stock], null, null as [Total]
    union
    -- Total Costs
    select 310, '', 'Total Costs' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers,
        sum(Supp) as Suppliers, sum(FYW) as [First Year Warranty], sum(Inter) as [Internal], sum(Other),
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #report_costs
    union
    -- blank
    select 320, '', ' ' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Repairs to Stock], null, null as [Total]
    union
    -- Margin
    select 330, '', 'Margin %' as Category, (sum(i.EW)-sum(c.ew)
        )/(case
            when sum(c.EW)=0 then 1
            else sum(c.EW)
        end) * 100 as [Extended Warranty], (sum(i.Cust)-sum(c.Cust)
        )/(case
            when sum(c.Cust)=0 then 1
            else sum(c.Cust)
        end) * 100 as Customers, (sum(i.Supp)-sum(c.Supp)
        )/(case
            when sum(c.Supp)=0 then 1
            else sum(c.Supp)
        end) * 100 as Suppliers, (sum(i.FYW)-sum(c.FYW)
        )/(case
            when sum(c.FYW)=0 then 1
        else sum(c.FYW)
        end) * 100 as [First Year Warranty], (sum(i.Inter)-sum(c.Inter)
        )/(case
            when sum(c.Inter)=0 then 1
            else sum(c.Inter)
        end) * 100 as [Repairs to Stock], (sum(i.Other)-sum(c.Other)
        )/(case
            when sum(c.Other)=0 then 1
            else sum(c.Other)
        end) * 100, (
            sum(i.EW + i.Cust + i.Supp + i.FYW + i.Inter + i.Other) -
            sum(c.EW + c.Cust + c.Supp + c.FYW + c.Inter + c.Other)
        )/(case
            when sum(c.EW + c.Cust + c.Supp + c.FYW + c.Inter + c.Other)=0 then 1
            else sum(c.EW + c.Cust + c.Supp + c.FYW + c.Inter + c.Other)
        end) * 100 as [Total]
    from #report_costs c
    inner join #report_income i
        on c.code=i.code
    union
    -- Cost Analysis
    select 399, '', 'COST ANALYSIS' as Category, null as [Extended Warranty], null as Customers, null as Suppliers,
        null as [First Year Warranty], null as [Internal], null as [Other], null as [Total]
    union
    select code, PG,Category, EW as [Extended Warranty], Cust as Customers, Supp as Suppliers, FYW as [First Year Warranty],
        Inter as [Repairs to Stock], Other, EW + Cust + Supp + FYW + Inter + Other as [Total]
    from #AnnualCosts
    union
    -- Total Costs
    select 499, '', 'Total Costs' as Category, sum(EW) as [Extended Warranty], sum(Cust) as Customers,
        sum(Supp) as Suppliers, sum(FYW) as [First Year Warranty], sum(Inter) as [Repairs to Stock], sum(Other) as [Other],
        sum(EW + Cust + Supp + FYW + Inter + Other) as [Total]
    from #AnnualCosts
