
if object_id('[Warranty].WarrantiesDueRenewalReport') IS NOT NULL
    DROP PROCEDURE [Warranty].WarrantiesDueRenewalReport
GO

CREATE PROCEDURE [Warranty].WarrantiesDueRenewalReport
    @branch smallint=null,
    @fascia char(1)=null,                           --A = All,  C = Courts, N = Non-Courts
    @dateFrom DATE = null,
    @dateTo DATE = null
as

IF @branch IS NOT NULL
	SET @fascia = NULL

declare @maxPromptDaysAfterExpired int,             --Max days to prompt after warranty has expired
        @promptDaysPriorToExpiry int,               --Days prior to warranty expiring to prompt
        @promptDaysPriorToExpirySettlement int,     --Days prior to warranty expiring to prompt when settled.
        @runDate datetime = getdate()


select @maxPromptDaysAfterExpired = value from CountryMaintenance where codename = 'warrantyexpirymaxprompt'
select @promptDaysPriorToExpiry = value from CountryMaintenance where codename = 'activepromptdays'
select @promptDaysPriorToExpirySettlement = value from CountryMaintenance where codename = 'warrantyexpirypromptdays'

IF (@dateFrom = NULL)
BEGIN
    SELECT @dateFrom = MIN(ws.EffectiveDate) FROM WarrantySale ws
END

IF (@dateTo = NULL)
BEGIN
    SELECT @dateTo = DATEADD(month, 2, GETDATE())
END


    ;WITH ProductCount as
    (
        select CustomerAccount, ItemId, max(WarrantyGroupId) as ProductCount
        from warranty.WarrantySale
        where ISNULL(WarrantyType, 'E') <> 'F'
        group by CustomerAccount, ItemId
    ),
    SettledDate as
    (
        select CustomerAccount, s.datestatchge
        from warranty.WarrantySale ws
        inner join [status] s on ws.CustomerAccount = s.acctno
        where ws.WarrantyType <> 'F'
        and s.statuscode = 'S'
        and s.datestatchge = (select max(s2.datestatchge)
                              from [status] s2
                              where s2.acctno = s.acctno)
    ),
    ServiceRepair as
    (
        select sr.Account, sr.WarrantyContractNo, sr.ResolutionPrimaryCharge
        from service.Request sr
        inner join warranty.WarrantySale ws
            on sr.Account = ws.CustomerAccount
                and ws.WarrantyContractNo = sr.WarrantyContractNo
    ),
    RenewalRetail as
    (
          select ws.CustomerAccount, ws.WarrantyId, isnull(max(wp.RetailPrice),0) as RetailPrice 
          from warranty.WarrantySale ws
          inner join warranty.Renewal wr on ws.WarrantyId = wr.WarrantyId
          inner join warranty.WarrantyPrice wp on wp.WarrantyId = wr.RenewalId
          group by ws.CustomerAccount, ws.WarrantyId
    )

    SELECT
        RowType,
        [Warranty Settlement Date],
        [Warranty Delivery Date],
        [Warranty Expiry Date],
        Fascia,
        [Branch Name],
        [Account Number],
        [Contract Number],
        [Product Code],
        [Product Quantity],
        [Product Description],
        [Warranty Code],
        [Warranty Description],
        [Sales Person Username],
        [Sales Person Name],
		[Customer Name],
		[Customer Address],
		[Customer Phone],
        [EW Repair],
        [Renewal Status],
        [Product Value],
        [Renewal Retail Value] 
    INTO #WarrantiesDueRenewal
    FROM (
        SELECT
            'D' as RowType,
            CONVERT(VARCHAR(10),sd.datestatchge, 103) as [Warranty Settlement Date],
            CONVERT(VARCHAR(10), ws.WarrantyDeliveredOn, 103) as [Warranty Delivery Date],
            dateadd(month, ws.WarrantyLength, ws.EffectiveDate) as [Warranty Expiry Date],
            case
                when b.StoreType = 'C' then 'Courts'
                else 'Non-Courts'
            end as [Fascia],
            b.branchname as [Branch Name],
            ws.CustomerAccount as [Account Number],
            ws.WarrantyContractNo as [Contract Number],
            ws.ItemNumber as [Product Code],
            COALESCE(p.ProductCount, 0) as [Product Quantity],
            ws.ItemDescription as [Product Description],
            ws.WarrantyNumber as [Warranty Code],
            w.[Description] as [Warranty Description],
            ws.SoldById as [Sales Person Username],
            ws.SoldBy as [Sales Person Name],
			cus.title + ' ' + cus.firstname + ' ' + cus.name AS [Customer Name],
			customerAddress.cusaddr1 + ', ' + customerAddress.cusaddr2 + ', ' + customerAddress.cusaddr3 AS [Customer Address],
			ISNULL(customerPhones.HomePhone, customerPhones.MobilePhone) AS [Customer Phone],
            case
                when sr.ResolutionPrimaryCharge = 'EW' then 'Y'
                else 'N'
            end as [EW Repair],
            case
                when a.currstatus = 'S' then 'SETTLED'
                when (DATEADD(month, ws.WarrantyLength, ws.EffectiveDate) < @runDate) then 'EXPIRED'
                when (DATEADD(month, ws.WarrantyLength, ws.EffectiveDate) > @runDate) then 'NEAR EXPIRY'
            end as [Renewal Status],
            ws.ItemPrice as [Product Value],
            isnull(rr.RetailPrice, 0) as [Renewal Retail Value]
        FROM Warranty.WarrantySale ws
        INNER JOIN acct a on ws.CustomerAccount = a.acctno
        INNER JOIN warranty.Warranty w on ws.WarrantyId = w.Id
        INNER JOIN branch b on ws.SaleBranch = b.branchno
        INNER JOIN stockinfo si on ws.ItemId = si.Id
        LEFT JOIN customer cus
            ON ws.CustomerId = cus.custid
        INNER JOIN ProductCount p
            on p.CustomerAccount = ws.CustomerAccount
                and p.ItemId = ws.ItemId
        LEFT JOIN SettledDate sd on ws.CustomerAccount = sd.CustomerAccount
        LEFT JOIN ServiceRepair sr
            on sr.Account = ws.CustomerAccount
                and sr.WarrantyContractNo = ws.WarrantyContractNo
        LEFT JOIN RenewalRetail rr
            on ws.CustomerAccount = rr.CustomerAccount
                and ws.WarrantyId = rr.WarrantyId
        LEFT JOIN (
            -- select the home address if it's valid (addtype=H),
            -- if invalid select the work address (addtype=W)
            SELECT
                addrs.custid,
                ISNULL(MAX(addrs.h_cusaddr1), MAX(addrs.w_cusaddr1)) AS cusaddr1,
                ISNULL(MAX(addrs.h_cusaddr2), MAX(addrs.w_cusaddr2)) AS cusaddr2,
                ISNULL(MAX(addrs.h_cusaddr3), MAX(addrs.w_cusaddr3)) AS cusaddr3,
                MAX(addrs.Email) AS Email
            FROM (
                SELECT cAddr.custid,
                    CASE 
                        WHEN cAddr.addtype = 'H' THEN cAddr.cusaddr1
                    END AS h_cusaddr1,
                    CASE 
                        WHEN cAddr.addtype = 'H' THEN cAddr.cusaddr2
                    END AS h_cusaddr2,
                    CASE 
                        WHEN cAddr.addtype = 'H' THEN cAddr.cusaddr3
                    END AS h_cusaddr3,
                    CASE 
                        WHEN cAddr.addtype = 'W' THEN cAddr.cusaddr1
                    END AS w_cusaddr1,
                    CASE 
                        WHEN cAddr.addtype = 'W' THEN cAddr.cusaddr2
                    END AS w_cusaddr2,
                    CASE 
                        WHEN cAddr.addtype = 'W' THEN cAddr.cusaddr3
                    END AS w_cusaddr3,
                    Email
                FROM custaddress cAddr
                WHERE cAddr.datemoved IS NULL
            ) addrs
            GROUP BY addrs.custid
        ) customerAddress
            ON ws.CustomerId = customerAddress.custid
        LEFT JOIN (
            SELECT
                home.custid AS custid,
                CASE WHEN LEN(LTRIM(home.DialCode)) > 0
                     THEN '(' + LTRIM(RTRIM(home.DialCode)) + ') '
                     ELSE ''
                END +
                CASE WHEN LEN(ISNULL(home.extnno, '')) > 0
                     THEN home.telno + ' ext:' + home.extnno + ')'
                     ELSE home.telno
                END AS HomePhone,
                CASE WHEN LEN(LTRIM(mobile.DialCode)) > 0
                     THEN '(' + LTRIM(RTRIM(mobile.DialCode)) + ') '
                     ELSE ''
                END +
                CASE WHEN LEN(ISNULL(mobile.extnno, '')) > 0
                     THEN mobile.telno + ' ext:' + mobile.extnno + ')'
                     ELSE mobile.telno
                END AS MobilePhone
            FROM custtel home, custtel mobile
            WHERE home.custid = mobile.custid AND home.telno<>mobile.telno AND
                  home.tellocn = 'H' AND mobile.tellocn = 'M' AND
                  home.datediscon IS NULL AND mobile.datediscon IS NULL
        ) customerPhones
            ON ws.CustomerId = customerPhones.custid
        WHERE ws.WarrantyType <> 'F' 
        and ws.WarrantyContractNo is not null
        and (
            (DATEADD(day,-@promptDaysPriorToExpiry, DATEADD(month, ws.WarrantyLength, ws.EffectiveDate)) < @runDate                 --Days before expiry
            and DATEADD(day,@maxPromptDaysAfterExpired, DATEADD(month, ws.WarrantyLength, ws.EffectiveDate)) > @runDate             --Daye after expiry
            and a.currstatus != 'S') 

            or

            (DATEADD(month,ws.WarrantyLength, ws.EffectiveDate) >= @runDate                                                         --Warranty Expiry
            and DATEADD(day, -@promptDaysPriorToExpirySettlement,DATEADD(month, ws.WarrantyLength, ws.EffectiveDate)) < @runDate    --Days prior to settlement
            and a.currstatus = 'S')    

        )
        and not exists(select * from warrantyrenewalpurchase wrp                                                                        --No existing renewal
                       where wrp.acctno = ws.CustomerAccount and wrp.originalcontractno = ws.WarrantyContractNo)
        and (@fascia is null OR (b.StoreType = @fascia OR @fascia = 'A'))
        and (@branch is null OR (b.branchno = @branch))
    ) WarrantiesDueRenewal
    WHERE [Warranty Expiry Date] >= @dateFrom
            AND [Warranty Expiry Date] <= @dateTo
    ORDER BY [Warranty Expiry Date]

    IF @@ROWCOUNT > 0
    BEGIN
        insert into #WarrantiesDueRenewal
        select 'T','Totals','',null,'','','','','',null,'','','',null,'','','','','','',sum(wdr.[Product Value]), sum(wdr.[Renewal Retail Value])
        from #WarrantiesDueRenewal wdr
    END

    SELECT [Warranty Settlement Date], [Warranty Delivery Date], [Warranty Expiry Date], Fascia, [Branch Name], [Account Number], [Contract Number], 
		[Product Code], [Product Quantity], [Product Description], [Warranty Code], [Warranty Description], [Sales Person Username], [Sales Person Name], 
		[Customer Name], [EW Repair], [Customer Address],[Customer Phone],
		[Renewal Status], [Product Value], [Renewal Retail Value] 
    FROM #WarrantiesDueRenewal
    ORDER BY RowType


Go

