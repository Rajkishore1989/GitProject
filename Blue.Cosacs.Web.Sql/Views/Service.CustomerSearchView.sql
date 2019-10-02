IF EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Service].[CustomerSearchView]'))
DROP VIEW [Service].[CustomerSearchView]
GO

CREATE VIEW [Service].[CustomerSearchView]
AS
    WITH MaxWarrantySalesId AS (
        SELECT
            MAX(Ws.Id) AS Maxid,
            Ws.CustomerAccount
        FROM Warranty.WarrantySale AS Ws
        INNER JOIN lineitem l
            ON l.itemId = ws.ItemId
            AND l.acctno = ws.CustomerAccount
            AND l.stocklocn = ws.StockLocation
        WHERE l.quantity > 0
        GROUP BY Ws.CustomerAccount, Ws.ItemId, StockLocation, Ws.WarrantyGroupId
    ),
    Renewal AS (
        SELECT DISTINCT
            Acctno,
            ContractNo,
            StockItemAcctno AS StockAcctno,
            OriginalContractno AS StockContractNo,
            ws.WarrantyNumber,
            ws.WarrantyLength
        FROM WarrantyRenewalPurchase wrp
        INNER JOIN Warranty.WarrantySale ws
            ON ws.CustomerAccount = wrp.acctno
    )
    SELECT
        Ws.Id AS WarrantySaleId,
        Ws.CustomerId,
        Ws.CustomerAccount,
        Ws.ItemId,
        Ws.ItemNumber,
        Ws.ItemPrice,
        Ws.ItemCostPrice,
        Ws.StockLocation,
        Ws.ItemDescription,
        Ws.ItemSupplier,
        Ws.ItemUPC,
        Ws.ItemDeliveredOn,
        Ws.WarrantyType,
        Ws.CustomerTitle,
        Ws.CustomerFirstName,
        Ws.CustomerLastName,
        Ws.CustomerAddressLine1,
        Ws.CustomerAddressLine2,
        Ws.CustomerAddressLine3,
        Ws.CustomerPostcode,
        Ws.SoldById,
        Ws.SoldBy,
        Ws.SoldOn,
        CASE
            WHEN ren.acctno IS NOT NULL THEN ren.WarrantyNumber
            WHEN orig.StockAcctno IS NOT NULL THEN orig.WarrantyNumber
            WHEN Ws.WarrantyType <> 'F' THEN Ws.WarrantyNumber
            WHEN Ws1.WarrantyType IS NOT NULL AND Ws1.WarrantyType <> 'F' THEN Ws1.WarrantyNumber
			WHEN ws1.WarrantyType IS NULL THEN ''
            ELSE Ws.WarrantyNumber
        END AS WarrantyNumber,
        CASE
            WHEN ren.acctno IS NOT NULL THEN ren.contractno
            WHEN orig.StockAcctno IS NOT NULL THEN orig.contractno
            WHEN Ws.WarrantyType <> 'F' AND Ws.Status = 'Active' THEN Ws.WarrantyContractNo
            WHEN Ws1.WarrantyType IS NOT NULL AND Ws1.WarrantyType <> 'F' AND Ws1.Status = 'Active' THEN Ws1.WarrantyContractNo
			WHEN ws1.WarrantyType IS NULL THEN ''
            ELSE Ws.WarrantyContractNo
        END AS WarrantyContractNo,
			--CASE
			--	WHEN Ws.WarrantyType <> 'F' AND Ws.Status = 'Active' THEN ISNULL(Ws.Warrantylength, 0)  + 
			--															case when ren.acctno is not null then ren.WarrantyLength 
			--															when orig.StockAcctno is not null then orig.WarrantyLength
			--															ELSE 0 END
			--	WHEN Ws1.WarrantyType <> 'F' AND Ws.Status = 'Active' THEN ISNULL(Ws1.Warrantylength, 0) + case when ren.acctno is not null then ren.WarrantyLength 
			--															when orig.StockAcctno is not null then orig.WarrantyLength
			--															ELSE 0 END
			--	ELSE 0
			--END AS WarrantyLength,
        CASE
            WHEN ren.acctno IS NOT NULL THEN ren.WarrantyLength
            WHEN orig.StockAcctno IS NOT NULL THEN orig.WarrantyLength
            WHEN Ws.WarrantyType <> 'F' AND Ws.Status = 'Active' THEN ISNULL(Ws.WarrantyLength, 0)
            WHEN Ws1.WarrantyType <> 'F' AND Ws.Status = 'Active' THEN ISNULL(Ws1.WarrantyLength, 0)
            ELSE 0
        END AS WarrantyLength,
        Ws.EffectiveDate as WarrantyEffectiveDate,
        CASE
            WHEN Ws.WarrantyType = 'F' THEN Ws.WarrantyNumber
            WHEN Ws1.WarrantyType IS NOT NULL AND Ws1.WarrantyType = 'F' THEN Ws1.WarrantyNumber
            ELSE NULL
        END AS ManufacturerWarrantyNumber,
        CASE
            WHEN Ws.WarrantyType = 'F' THEN Ws.WarrantyContractNo
            WHEN Ws1.WarrantyType IS NOT NULL AND Ws1.WarrantyType = 'F' THEN Ws1.WarrantyContractNo
            ELSE NULL
        END AS ManufacturerWarrantyContractNo,
        CASE
            WHEN Ws.WarrantyType = 'F' THEN ISNULL(Ws.WarrantyLength, 0)
            WHEN Ws1.WarrantyType IS NOT NULL AND Ws1.WarrantyType = 'F' THEN ISNULL(Ws1.WarrantyLength, 0)
            ELSE 0
        END AS ManufacturerWarrantyLength,
        Ws.CustomerNotes,
        Sr.ItemSerialNumber,
        Ws.WarrantyGroupId,
        SrI.Type             -- #14820 "II" if open installation exists for item
    FROM
        Warranty.WarrantySale AS Ws
        INNER JOIN MaxWarrantySalesId AS M
            ON M.Maxid = Ws.Id
            AND ws.CustomerAccount = M.CustomerAccount
        LEFT JOIN Warranty.WarrantySale AS Ws1
            ON Ws.CustomerAccount = Ws1.CustomerAccount
            AND Ws.WarrantyGroupId = Ws1.WarrantyGroupId
            AND Ws.ItemId = Ws1.ItemId 
            AND Ws.Id != Ws1.Id
            AND ISNULL(ws1.Status, '') != 'Redeemed'
        LEFT OUTER JOIN Renewal ren
            ON ren.acctno = Ws.CustomerAccount
            AND ren.Contractno = ws.WarrantyContractNo
        LEFT OUTER JOIN Renewal orig
            ON orig.StockAcctno = Ws.CustomerAccount
            AND orig.StockContractNo = ws.WarrantyContractNo

        LEFT JOIN (
            SELECT ItemNumber, WarrantyGroupId, Account, MAX(ItemSerialNumber) AS ItemSerialNumber
            FROM Service.Request
            GROUP BY ItemNumber, WarrantyGroupId, Account
            /* SELECT *
            FROM
            (
                SELECT Itemnumber, Warrantygroupid, Account, Itemserialnumber, ROW_NUMBER()OVER(PARTITION BY Warrantygroupid ORDER BY Createdon DESC)AS Rn
                FROM Service.Request
            ) AS A
            WHERE Rn = 1
            */
        ) AS Sr
            ON Sr.ItemNumber = Ws.ItemNumber
            AND Sr.WarrantyGroupId = Ws.WarrantyGroupId
            AND Sr.Account = Ws.CustomerAccount
        INNER JOIN Acct AS C
            ON C.Acctno = Ws.CustomerAccount
        LEFT JOIN Service.Request SrI
            ON SrI.ItemId = Ws.ItemId
            AND SrI.Account = Ws.CustomerAccount
            AND SrI.IsClosed = 0
    WHERE
        C.Accttype != 's'
        AND NOT EXISTS (
            SELECT *
            FROM Service.Request AS Sr
            WHERE
                Sr.Account = Ws.CustomerAccount
                AND Sr.ItemStockLocation = Ws.StockLocation
                AND Sr.ItemId = Ws.ItemId
                AND Sr.IsClosed = 0
                AND Sr.WarrantyGroupId = Ws.WarrantyGroupId
                AND Sr.WarrantyContractId = Ws.Id
        )
        AND ISNULL(ws.Status, '') != 'Redeemed'
GO
