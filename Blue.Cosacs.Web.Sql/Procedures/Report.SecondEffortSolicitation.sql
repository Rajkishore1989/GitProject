IF OBJECT_ID('Report.SecondEffortSolicitation') IS NOT NULL
    DROP PROCEDURE Report.SecondEffortSolicitation
GO
CREATE PROCEDURE Report.SecondEffortSolicitation
    @CurrentDate DATE,
    @CustomerGroup SMALLINT = 1,
    @ExactDaysFromDeliveryOnCustomersWithNoEWIR SMALLINT = 1,
    @DaysToFywExpirationOnCustomersWithNoEW SMALLINT = 1,
    @DaysSinceFywRepairOnCustomersWithNoEW SMALLINT = 1,
    @SalesPersonId INT = NULL,
    @Chain CHAR(1) = 'A', -- Chain: A = All, C = Courts, N = Non-Courts/Lucky Dollar
    @Branch SMALLINT = NULL
AS
BEGIN

IF (@Chain = 'A')
BEGIN
    SELECT @Chain = null
END

-- Customers who did not buy an EW/IR warranty and received their product(s) exactly X days ago
DECLARE @CustomerGroupFilter1 TINYINT = 0
-- Customers with no EW whose FYW (First Year Warranty) will expire within the next Y days
DECLARE @CustomerGroupFilter2 TINYINT = 0
-- Customers with no EW who have had a FYW repair within the last Z days
DECLARE @CustomerGroupFilter3 TINYINT = 0

IF (@CustomerGroup = 1)
BEGIN
    SELECT
        @CustomerGroupFilter1 = 1,
        @CustomerGroupFilter2 = 0,
        @CustomerGroupFilter3 = 0,
        --@ExactDaysFromDeliveryOnCustomersWithNoEWIR = 0,
        @DaysToFywExpirationOnCustomersWithNoEW = 0,
        @DaysSinceFywRepairOnCustomersWithNoEW = 0
END
IF (@CustomerGroup = 2)
BEGIN
    SELECT
        @CustomerGroupFilter1 = 0,
        @CustomerGroupFilter2 = 1,
        @CustomerGroupFilter3 = 0,
        @ExactDaysFromDeliveryOnCustomersWithNoEWIR = 0,
        --@DaysToFywExpirationOnCustomersWithNoEW = 0,
        @DaysSinceFywRepairOnCustomersWithNoEW = 0
END
IF (@CustomerGroup = 3)
BEGIN
    SELECT
        @CustomerGroupFilter1 = 0,
        @CustomerGroupFilter2 = 0,
        @CustomerGroupFilter3 = 1,
        @ExactDaysFromDeliveryOnCustomersWithNoEWIR = 0,
        @DaysToFywExpirationOnCustomersWithNoEW = 0
        --@DaysSinceFywRepairOnCustomersWithNoEW = 0
END

    SELECT  distinct sub.[FYW Expiry Date],
            sub.[Product Delivery Date],
            sub.[Order Date],
            CASE WHEN sub.Chain = 'C'
                THEN 'COURTS'
                ELSE 'NON COURTS (Tropigas/Lucky Dollar)'
            END AS Chain,
            sub.[Branch Name],
            sub.[Account Number],
            sub.[Product Code],
			sub.[Product Quantity],
            sub.[Product Value],
            sub.[Product Description],
            sub.[Warranty Code],
			sub.[Missed Warranty Quantity],
            sub.[Warranty Retail Price],
            sub.[Warranty Description],
            sub.[Account Type],
            sub.[Product Category],
            sub.[Sales Person Id],
            sub.[Sales Person Name],
            sub.[Customer Id],
            sub.[Customer Title],
            sub.[Customer Name],
            sub.[Customer First Name],
            sub.[Customer Address1],
            sub.[Customer Address2],
            sub.[Customer Address3],
            sub.[Customer Email],
            sub.[Customer Mobile Phone],
            sub.[Customer Home Phone],
            sub.commissionPercentage
    FROM (
        SELECT
            CONVERT(VARCHAR, DATEADD(year, 1, ps.SoldOn), 103) AS [FYW Expiry Date],
            CONVERT(VARCHAR, prodDelivery.datedel, 103) AS [Product Delivery Date],
            CONVERT(VARCHAR, ps.SoldOn, 103) AS [Order Date],
            b.StoreType AS Chain,
            CAST(b.branchno AS VARCHAR(3)) + ' - ' + b.branchname AS [Branch Name],
            ps.CustomerAccount AS [Account Number],
            ps.ItemNumber AS [Product Code],
			ps.Quantity as [Missed Warranty Quantity],
            CAST(ROUND(ps.ItemPrice, 2) AS VARCHAR) AS [Product Value],
            RTRIM(s.itemdescr1) + ' - ' + RTRIM(s.itemdescr2) AS [Product Description], -- ??? Product description
            ps.WarrantyNumber AS [Warranty Code], -- ??? is this right...
            CAST(ROUND(ps.WarrantyRetailPrice, 2) AS VARCHAR) AS [Warranty Retail Price],
            w.[Description] AS [Warranty Description],
            CASE -- Account type (cash/credit/POS)
                WHEN a.accttype = 'C' THEN 'cash'
                WHEN a.accttype IN ('B', 'M', 'O', 'R', 'T') THEN 'credit'
                ELSE 'POS'
            END AS [Account Type],
            --c.category AS [Product Category],
            CASE
                WHEN c.category = 'PCE' THEN 'Electrical'
                WHEN c.category = 'PCW' THEN 'Workstation'
                WHEN c.category = 'PCF' THEN 'Furniture'
                WHEN c.category = 'PCO' THEN 'OTHER'
            END AS [Product Category],
            ps.SoldById AS [Sales Person Id],
            u.FullName AS [Sales Person Name],
            ps.CustomerId AS [Customer Id],
            cus.title AS [Customer Title],
            cus.name AS [Customer Name],
            cus.firstname AS [Customer First Name],
            customerAddress.cusaddr1 AS [Customer Address1],
            customerAddress.cusaddr2 AS [Customer Address2],
            customerAddress.cusaddr3 AS [Customer Address3],
            customerAddress.Email AS [Customer Email],
            customerPhones.MobilePhone AS [Customer Mobile Phone],
            customerPhones.HomePhone AS [Customer Home Phone],
			prodOrder.OrdQuantity as [Product Quantity]

            -- The MissedSalesComission is calculated on the C# side
            ,CASE
                WHEN a.accttype = 'C' THEN commission.PercentageCash
                WHEN a.accttype IN ('B', 'M', 'O', 'R', 'T') THEN commission.Percentage
                ELSE commission.PercentageCash
            END AS commissionPercentage -- To calculate the SalesCommission

            -- Option1
            , CASE -- Customers who did not buy an EW/IR warranty and received their product(s) exactly X days ago
                WHEN @ExactDaysFromDeliveryOnCustomersWithNoEWIR >= 0							-- #19142
                AND DATEADD(DAY, @ExactDaysFromDeliveryOnCustomersWithNoEWIR, prodDelivery.datedel) = @CurrentDate THEN 1			-- EXACTLY!!
                ELSE 0
            END AS Option1
            -- Option2
            , CASE -- Customers with no EW whose FYW (First Year Warranty) will expire within the next Y days
                WHEN @DaysToFywExpirationOnCustomersWithNoEW > 0 
                AND w.TypeCode='E'
                AND DATEADD(YEAR, 1, ps.SoldOn) >= @CurrentDate
                AND DATEADD(YEAR, 1, ps.SoldOn) <= DATEADD(DAY, @DaysToFywExpirationOnCustomersWithNoEW, @CurrentDate) THEN 1
                ELSE 0
            END AS Option2
            -- Option3
            , CASE -- Customers with no EW who have had a FYW repair within the last Z days
                WHEN @DaysSinceFywRepairOnCustomersWithNoEW > 0 AND w.TypeCode='E'
                AND serviceRequest.CreatedOn IS NOT NULL
                AND DATEADD(DAY, @DaysSinceFywRepairOnCustomersWithNoEW, serviceRequest.CreatedOn) >= @CurrentDate
                AND DATEADD(DAY, -1 * @DaysSinceFywRepairOnCustomersWithNoEW, serviceRequest.CreatedOn) <= @CurrentDate THEN 1
                ELSE 0
            END AS Option3
        FROM [Warranty].WarrantyPotentialSale ps
        JOIN Warranty.Warranty w
            ON ps.WarrantyId = w.Id AND w.TypeCode <> 'F'
        JOIN (
            SELECT wt.WarrantyId, t.Name AS WarrantyTagName
            FROM Warranty.WarrantyTags WT
            JOIN Warranty.Tag T
                ON WT.TagId = T.Id
                AND WT.LevelId = T.LevelId
        ) wTags ON w.Id = wTags.WarrantyId
        JOIN StockInfo s
            ON ps.ItemNumber = s.itemno
        JOIN branch b
            ON ps.SaleBranch = b.branchno
        JOIN acct a
            ON ps.CustomerAccount = a.acctno
        LEFT JOIN [Service].[Request] serviceRequest
            ON serviceRequest.[Type] IN ('SI', 'II')
            AND serviceRequest.Account = ps.CustomerAccount
            AND serviceRequest.ItemNumber = s.itemno
        LEFT JOIN [Admin].[User] u
            ON ps.SoldById = u.Id
        LEFT JOIN customer cus
            ON ps.CustomerId = cus.custid
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
            ON ps.CustomerId = customerAddress.custid
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
            ON ps.CustomerId = customerPhones.custid
        LEFT JOIN (
            SELECT d.acctno, d.ItemID, d.itemno, CAST(MAX(d.datedel) AS SMALLDATETIME) AS datedel
            FROM delivery d
            WHERE delorcoll = 'D'
            GROUP BY d.acctno, d.ItemID, d.itemno
        ) prodDelivery
            ON ps.CustomerAccount = prodDelivery.acctno
            AND ps.ItemId = prodDelivery.ItemID
            AND ps.ItemNumber = prodDelivery.itemno
        LEFT JOIN code c
            ON s.category = c.code
            AND c.category IN ('PCE', 'PCW', 'PCF', 'PCO')
        LEFT JOIN (
            SELECT TOP(1)
                CASE
                    WHEN scr.ItemText = '12' THEN 'Electric'
                END AS WarrantyType
                ,scr.commissionType
                ,scr.Percentage
                ,scr.PercentageCash
            FROM [SalesCommissionRates] scr
            WHERE scr.ItemText = '12' AND CommissionType <> 'TT' -- only product commission types
                  AND scr.DateTo >= @CurrentDate AND scr.DateFrom <= @CurrentDate
            UNION
            SELECT TOP(1)
                CASE
                    WHEN scr.ItemText = '82' THEN 'Furniture'
                END AS WarrantyType
                ,scr.commissionType
                ,scr.Percentage
                ,scr.PercentageCash
            FROM [SalesCommissionRates] scr
            WHERE scr.ItemText = '82' AND CommissionType <> 'TT' -- only product commission types
                  AND scr.DateTo >= @CurrentDate AND scr.DateFrom <= @CurrentDate
        ) commission
            ON commission.WarrantyType =
                CASE
                    WHEN wTags.WarrantyTagName = 'Furniture' THEN 'Furniture'
                    ELSE 'Electric' -- use 'electrical' commission as default
                END
		LEFT JOIN (											-- #19099 
            SELECT l.acctno,l.agrmtno,l.ItemID,sum(l.quantity) as OrdQuantity
            FROM Lineitem l
            GROUP BY l.acctno, l.agrmtno,l.ItemID, l.stocklocn
        ) prodOrder
            ON ps.CustomerAccount = prodOrder.acctno
			and ps.agreementNumber = prodOrder.agrmtno
            AND ps.ItemId = prodOrder.ItemID
		LEFT JOIN warranty.warrantysale ws
            ON ws.ItemNumber=ps.ItemNumber
            AND ws.CustomerAccount=ps.CustomerAccount
            AND ws.warrantyId is not null
            AND ws.WarrantyType!='F' -- #19099	
		LEFT JOIN
		(
			select count(*) as warrantyCount, ws1.CustomerAccount, ws1.AgreementNumber, ws1.ItemId, ws1.StockLocation
			from warranty.WarrantySale ws1
			where ws1.WarrantyType !='F'
			group by ws1.CustomerAccount,  ws1.AgreementNumber, ws1.ItemId, ws1.StockLocation
		) warrantySaleCount
			ON ps.CustomerAccount = warrantySaleCount.CustomerAccount
			AND ps.AgreementNumber = warrantySaleCount.AgreementNumber
			AND ps.ItemId = warrantySaleCount.ItemId
        WHERE b.branchno = ISNULL(@Branch, b.branchno)
            AND b.StoreType = ISNULL(@Chain, b.StoreType)
			--and ws.id is null							-- #19099
			and isnull(warrantySaleCount.warrantyCount,0) < OrdQuantity
			and OrdQuantity>0							-- #19099 - not cancelled	
    ) sub
    WHERE Option1 = @CustomerGroupFilter1
        AND Option2 = @CustomerGroupFilter2
        AND Option3 = @CustomerGroupFilter3
        AND [Sales Person Id] = ISNULL(@SalesPersonId, [Sales Person Id])

END
