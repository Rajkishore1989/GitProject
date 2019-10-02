IF EXISTS( SELECT *
             FROM sys.views
             WHERE object_id = OBJECT_ID( N'[Service].[ItemsByInvoiceNoSearchView]' ))BEGIN
        DROP VIEW Service.ItemsByInvoiceNoSearchView
END

GO

CREATE VIEW [Service].[ItemsByInvoiceNoSearchView]
AS

WITH ItemDetails AS (
	SELECT 
		iv.stocklocn AS StockLocation, 
		iv.itemdescr1 AS ItemDescription1, 
		iv.price AS Price, 
		iv.datedel AS DeliveryDate, 
		iv.ItemId, 
		iv.itemNo, 
		iv.Supplier, 
		iv.SoldOn, 
		iv.SoldBy, 
		iv.SoldByName, 
		iv.WarrantyNumber, 
		iv.WarrantyLength, 
		iv.WarrantyContractNo, 
		iv.ManWarrantyLength, 
		ISNULL(iv.ManufacturerWarrantyContractNo, 0) AS ManufacturerWarrantyContractNo,
		iv.InvoiceNumber,
		iv.custid AS CustomerID,
		iv.acctno AS AccountNo,
		COUNT(iv.ItemId) AS TotalItemCount,
		ISNULL(Rq.TotalRequests, 0) AS TotalRequests
	FROM Service.InvoiceSearchView iv
	LEFT JOIN (SELECT COUNT(ItemId) AS TotalRequests,SR.ItemId,SR.Branch,SR.InvoiceNumber FROM Service.Request SR
	WHERE SR.State <> 'Closed'
	GROUP BY SR.ItemId,SR.Branch,SR.InvoiceNumber
	) Rq on Rq.InvoiceNumber = CAST(iv.InvoiceNumber AS varchar(50)) AND Rq.ItemId = CAST(iv.ItemId AS varchar(25)) AND Rq.Branch = iv.stocklocn 
	--WHERE iv.InvoiceNumber = 1058017
	GROUP BY 	iv.stocklocn, 
		iv.itemdescr1, 
		iv.price, 
		iv.datedel, 
		iv.ItemId, 
		iv.itemNo, 
		iv.Supplier, 
		iv.SoldOn, 
		iv.SoldBy, 
		iv.SoldByName, 
		iv.WarrantyNumber, 
		iv.WarrantyLength, 
		iv.WarrantyContractNo, 
		iv.ManWarrantyLength, 
		ISNULL(iv.ManufacturerWarrantyContractNo, 0),
		Rq.TotalRequests,
		iv.InvoiceNumber,
		iv.custid,
		iv.acctno)
SELECT	DISTINCT 
		I.StockLocation, 
		I.ItemDescription1, 
		I.Price, 
		I.DeliveryDate, 
		I.ItemId, 
		I.itemNo, 
		I.Supplier, 
		I.SoldOn, 
		I.SoldBy, 
		I.SoldByName, 
		I.WarrantyNumber, 
		I.WarrantyLength, 
		I.WarrantyContractNo, 
		I.ManWarrantyLength, 
		I.ManufacturerWarrantyContractNo,
		I.InvoiceNumber,
		I.CustomerID,
		I.AccountNo,
		I.TotalItemCount,
		I.TotalRequests,
		C.CustomerFirstName,
		C.CustomerLastName,
		C.CustomerTitle,
		C.CustomerAddressLine1,
		C.CustomerAddressLine2,
		C.CustomerAddressLine3,
		C.CustomerPostcode,
		C.CustomerNotes
FROM ItemDetails I
LEFT JOIN Warranty.Warrantysale AS C 
	ON C.CustomerId = I.CustomerID AND C.CustomerAccount = I.AccountNo

GO