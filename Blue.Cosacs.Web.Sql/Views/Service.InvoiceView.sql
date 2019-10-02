IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[InvoiceSearchView]'))
DROP VIEW  service.InvoiceSearchView
Go

CREATE VIEW service.InvoiceSearchView
AS


WITH MaxWarrantySalesId as
(
	select max(ws.id) as MaxId
	from warranty.WarrantySale ws
	group by ws.InvoiceNumber, ItemId, StockLocation, WarrantyGroupId
)

SELECT  ws.Id as WarrantySaleId, ws.CustomerId as custid , ws.CustomerAccount as acctno, ws.ItemId,ws.ItemNumber as itemNo,
		ws.ItemPrice as price,  ws.StockLocation as stocklocn,  ws.ItemDescription as itemdescr1, ws.ItemSupplier as Supplier, 
		ws.ItemDeliveredOn as datedel, ws.SoldOn, 
		cast(SUBSTRING(ws.InvoiceNumber, CHARINDEX(' ',ws.InvoiceNumber, 1) + 1, len(ws.InvoiceNumber) - CHARINDEX(' ',ws.InvoiceNumber, 1)) as int) AS InvoiceNumber,
		ws.StockLocation AS branch,
		0 as SoldBy,ws.SoldBy AS SoldByName,
		     case when ws.WarrantyType <> 'F' then ws.WarrantyNumber
			 when ws1.WarrantyType is not null and ws1.WarrantyType <> 'F' then ws1.WarrantyNumber
			 else null end as WarrantyNumber, 
		case when ws.WarrantyType <> 'F' and ws.[Status] = 'Active' then ws.WarrantyContractNo
			 when ws1.WarrantyType is not null and ws1.WarrantyType <> 'F' and ws1.[Status] = 'Active' then ws1.WarrantyContractNo
			 else null end as WarrantyContractNo, 
		case when ws.WarrantyType <> 'F' and ws.[Status] = 'Active' then cast(ISNULL(ws.WarrantyLength, 0) as smallint)
			 when ws1.WarrantyType <> 'F' and ws.[Status] = 'Active' then cast(ISNULL(ws1.WarrantyLength, 0) as smallint)
			 else cast(0 as smallint) end as WarrantyLength,
        case when  ws.WarrantyType = 'F' then ws.WarrantyNumber 
			 when ws1.WarrantyType is not null and ws1.WarrantyType = 'F' then ws1.WarrantyNumber 
			 else null end as ManufacturerWarrantyNumber,
		case when ws.WarrantyType = 'F' then ws.WarrantyContractNo 
		     when ws1.WarrantyType is not null and ws1.WarrantyType = 'F' then ws1.WarrantyContractNo
			 else null end as ManufacturerWarrantyContractNo, 
		case when ws.WarrantyType = 'F' then cast(ISNULL(ws.WarrantyLength, 0) as smallint)
			 when ws1.WarrantyType is not null and ws1.WarrantyType = 'F' then cast(ISNULL(ws1.WarrantyLength, 0) as smallint)
			 else cast(0 as smallint) end as ManWarrantyLength
	
FROM Warranty.WarrantySale ws
INNER JOIN MaxWarrantySalesId m on m.MaxId = ws.id
LEFT OUTER JOIN Warranty.WarrantySale ws1
    ON ws.CustomerAccount = ws1.CustomerAccount
	AND ws.InvoiceNumber = ws1.InvoiceNumber
    AND ws.WarrantyGroupId = ws1.WarrantyGroupId
    AND ws.ItemId = ws1.ItemId
    --AND ws1.WarrantyType <> 'F'
    AND ws.Id != ws1.Id
LEFT OUTER JOIN 
    (select * from 
        (select ItemNumber, WarrantyGroupId, Account, ItemSerialNumber,
        ROW_NUMBER() OVER (PARTITION BY WarrantyGroupId ORDER BY CreatedOn DESC) AS rn 
        from Service.Request ) a where rn = 1) sr
    ON
    sr.ItemNumber = ws.ItemNumber
    AND sr.WarrantyGroupId = ws.WarrantyGroupId
    AND sr.Account = ws.CustomerAccount
WHERE
    --ws.WarrantyType = 'F' AND
	not exists(select * from									--#13738
	Service.Request sr      
    WHERE sr.Account = ws.CustomerAccount
		    AND sr.ItemStockLocation = ws.StockLocation
    AND sr.ItemId = ws.ItemId
    AND sr.IsClosed = 0
	AND sr.WarrantyGroupId = ws.WarrantyGroupId
	AND sr.WarrantyContractId = ws.Id)
	AND ws.ItemQuantity != 0
	--AND ws.[Status] != 'Cancelled' --#16309
    --(SELECT COUNT(*) FROM Service.Request sr      
    --    WHERE sr.Account = ws.CustomerAccount
    --    AND sr.ItemStockLocation = ws.StockLocation
    --    AND sr.ItemId = ws.ItemId
    --    AND sr.IsClosed = 0
    --) = 0



