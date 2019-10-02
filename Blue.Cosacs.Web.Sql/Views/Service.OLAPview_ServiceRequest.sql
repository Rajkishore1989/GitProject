IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'OLAPview_ServiceRequest'
		   AND ss.name = 'Service')
DROP VIEW  Service.OLAPview_ServiceRequest
GO

CREATE VIEW Service.OLAPview_ServiceRequest
AS

SELECT
	Sr.Id AS Servicerequest
	,Sr.State
	,Sr.Itemsupplier AS Supplier
	,Si.Category
	,DATEADD(Dd, DATEDIFF(Dd, 0, Sr.Createdon), 0) AS Datelogged
	,Si.Id AS Productid
	,Isnull(Sr.Itemnumber, ' ') AS Product
	,CASE
		WHEN Sr.State IN ('New', 'Awaiting allocation') THEN 'Unallocated'
		WHEN Sr.State != 'Closed' THEN 'Allocated'
		ELSE Sr.State
	END AS Outstandingtype
	,CASE
		WHEN DATEDIFF(D, Sr.Createdon, GETDATE()) > 14 THEN 15
		WHEN DATEDIFF(D, Sr.Createdon, GETDATE()) > 7 THEN 8
		WHEN DATEDIFF(D, Sr.Createdon, GETDATE()) > 3 THEN 4
		ELSE 0
	END AS Daysoutstanding
	,T.Date AS Dateallocated
	,CASE
		WHEN T.Date IS NULL THEN 15
		WHEN DATEDIFF(D, Sr.Createdon, T.Date) > 14 THEN 15
		WHEN DATEDIFF(D, Sr.Createdon, T.Date) > 7 THEN 8
		WHEN DATEDIFF(D, Sr.Createdon, T.Date) > 3 THEN 4
		ELSE 0
	END AS Daystoallocate
	,CASE
		WHEN Sr.Itemdeliveredon > '1900-01-01' AND Sr.Manwarrantylength > 0 AND DATEADD(M, Sr.Manwarrantylength, Sr.Itemdeliveredon) >= Sr.Createdon THEN 'FYW'
		WHEN Sr.Warrantycontractid IS NOT NULL AND DATEADD(M, Sr.Warrantylength, Sr.Itemdeliveredon) >= Sr.Createdon THEN 'EW'
		ELSE 'None'
	END AS Warrantytype
	,Sr.CustomerId
	,Sr.Resolution
	,SR.ResolutionLabourCost
	,Sr.ResolutionAdditionalCost
	,Sr.ResolutionTransportCost
	,Sr.ItemAmount
	,TotalCharge.TotalCost
	,Convert(Date, Sr.CreatedOn) AS CreatedOn
	,Convert(DATETIME2(0), DATEADD(dd, DATEDIFF(dd, 0, Sr.CreatedOn), 0)) AS CreatedOnDay
	,Convert(Date, Sr.ItemDeliveredOn) AS DeliveredOn
	,Sr.ResolutionDate
	,Sr.[Type] AS RequestType
	,sr.WarrantyContractNo AS WarrantyContractNumber,
	sr.Account AS CustomerAccount,
	sr.WarrantyContractId AS WarrantySaleID
FROM
	Service.Request AS Sr
	LEFT JOIN Stockinfo AS Si 
		ON Si.Id = Sr.Itemid
	LEFT JOIN Service.Technicianbooking AS T 
		ON Sr.Id = T.Requestid
	LEFT JOIN
	(
		SELECT SUM(Value) AS TotalCost, RequestId
		FROM Service.Charge
		GROUP BY RequestId
	) AS TotalCharge
		ON Sr.Id =  TotalCharge.RequestId

GO


