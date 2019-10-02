
if object_id('[Service].CustomerFeedback') IS NOT NULL
	DROP PROCEDURE [Service].CustomerFeedback
GO

CREATE PROCEDURE 	[Service].[CustomerFeedback]
	@dateResolvedFrom DATETIME,
	@dateResolvedTo DATETIME,
	@purchaseBranch int=null,
	@department varchar(5)=null,
	@Fascia varchar(10)=null,
	@technicianName varchar(25)=null
as

SELECT
	sr.ResolutionDate as [Resolution Date],
	sr.Id AS [Service Request Number],
	CASE
		WHEN b.StoreType = 'C' THEN 'Courts'
		ELSE 'Non-Courts'
	END AS Fascia,
	sr.WarrantyContractNo AS [Warranty Contract No],
	sr.Itemnumber AS [Product Code],
	sr.item AS [Product Description],
	--si.itemdescr2 AS ProductDescription2,
	sr.ItemModelNumber AS [Model Number],
	sr.ItemSerialNumber AS [Serial NUmber],
	case when sr.ReplacementIssued is null then 'No' else 'Yes' end as [Replacement Issued],
	ISNULL(sr.CustomerFirstName, '') + ' ' + ISNULL(sr.CustomerLastName, '') AS [Customer Name],
	ISNULL(sr.CustomerAddressLine1 + CHAR(13), '') + ISNULL(sr.CustomerAddressLine2 + CHAR(13), '') + ISNULL(sr.CustomerAddressLine3 + CHAR(13), '') AS [Customer Address],
	sr.Account AS [Account Number],
	sr.Resolution,
	w.[Description] AS [Waranty Description],
	TB.FullName AS [Technician Name],
	case when ch.type is not null then ch.Type +' ' + ch.value + ' ' else '' end + case when cm.type is not null then cm.Type +' ' + cm.value + ' ' else '' end +
			case when cw.type is not null then cw.Type +' ' + cw.value else '' end  AS [Customer Phone],
	Case when IsClosed=1 then 'Yes' else 'No' end as Closed
FROM
	Service.Request sr
	left join service.RequestContact ch on sr.id=ch.RequestId and ch.Type='HomePhone'
	left join service.RequestContact cm on sr.id=cm.RequestId and cm.Type='MobilePhone'
	left join service.RequestContact cw on sr.id=cw.RequestId and cw.Type='WorkPhone'
	INNER JOIN branch b
		ON sr.Branch = b.branchno				-- sr.Branch is wher service request raised - may need to be Purchase Branch!!
	--LEFT JOIN Stockinfo AS Si 
	--	ON Si.Id = Sr.Itemid
	LEFT JOIN 
	(
		SELECT ws.Id, w.Description
		FROM Warranty.WarrantySale ws INNER JOIN Warranty.Warranty w ON ws.WarrantyId = w.Id
	) w
		ON w.Id =  sr.WarrantyContractId
	LEFT JOIN 
	(
		SELECT 
			t.RequestId,
			u.FullName
		FROM 
			Service.TechnicianBooking t
			INNER JOIN 
			(
				SELECT requestid, MAX(id) AS id FROM Service.TechnicianBooking t GROUP BY requestid
			) TA
				ON t.Id = TA.id
			INNER JOIN Admin.[User] u
				ON t.UserId = u.Id
	) AS TB
		ON sr.Id = TB.RequestId
	INNER JOIN OLAPview_Customer Cust
		ON sr.CustomerId = Cust.CustomerId

	where sr.ResolutionDate between @dateResolvedFrom and @dateResolvedTo
		and (sr.ItemStockLocation=@purchaseBranch or @purchaseBranch is null)		-- may need Purchase branch on Service.Request!!
		and (@department is null or @department is not null)						-- need Department
		and (@Fascia = b.StoreType or @Fascia ='A' or @Fascia is null)									-- 
		and (@technicianName=TB.FullName or @technicianName is null)


Go

