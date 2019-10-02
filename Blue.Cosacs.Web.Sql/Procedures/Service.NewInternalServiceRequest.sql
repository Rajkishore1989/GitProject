-- transaction: true
-- Change the previous line to false to disable running this whole migration in one transaction.
-- Removing that first line will default to 'true'.
-- 
-- Put your SQL code here
if exists (select * from dbo.sysobjects where id = object_id('[Service].[NewInternalServiceRequest]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
	drop procedure [Service].[NewInternalServiceRequest]
GO

create PROCEDURE [Service].[NewInternalServiceRequest] 
	@Type varchar(4),
	@CustomerId varchar(50) ,
	@CustomerAccount char(12) 
AS
BEGIN
	SET NOCOUNT ON;

	
	IF OBJECT_ID('tempdb..#ServiceData','U') IS NOT NULL 
		DROP TABLE #ServiceData
		
	IF OBJECT_ID('tempdb..#x','U') IS NOT NULL 
		DROP TABLE #x
		
	IF OBJECT_ID('tempdb..#y','U') IS NOT NULL 
		DROP TABLE #y
		
	IF OBJECT_ID('tempdb..#WarrantySaleIds','U') IS NOT NULL 
		DROP TABLE #WarrantySaleIds

	CREATE TABLE #WarrantySaleIds
	(
		id Int
	)

	CREATE TABLE #x
	(
		WarrantySaleId					int NULL,
		CustomerId						varchar(50) NULL,
		CustomerAccount					char(12) NULL,
		ItemId							int NULL,
		ItemNumber						varchar(25) NULL,
		ItemPrice						money NULL,
		ItemCostPrice					money NULL,
		StockLocation					smallint NULL,
		ItemDescription					varchar(100) NULL,
		ItemSupplier					varchar(50) NULL,
		ItemUPC							varchar(25) NULL,
		ItemDeliveredOn					date NULL,
		WarrantyType					char(1) NULL,
		CustomerTitle					varchar(25) NULL,
		CustomerFirstName				varchar(50) NULL,
		CustomerLastName				varchar(60) NULL,
		addtype							varchar(25) NULL,
		CustomerAddressLine1			varchar(50) NULL,
		CustomerAddressLine2			varchar(50) NULL,
		CustomerAddressLine3			varchar(50) NULL,
		CustomerPostcode				varchar(10) NULL,
		SoldById						int NULL,
		SoldBy							varchar(50) NULL,
		SoldOn							date NULL,
		WarrantyNumber					varchar(20) NULL,
		WarrantyContractNo				nvarchar(40) NULL,
		WarrantyLength					int NULL,
		WarrantyEffectiveDate			date NULL,
		ManufacturerWarrantyNumber		varchar(20) NULL,
		ManufacturerWarrantyContractNo	varchar(20) NULL,
		ManufacturerWarrantyLength		int NULL,
		CustomerNotes					varchar(4000) NULL,
		ItemSerialNumber				varchar(50) NULL,
		WarrantyGroupId					int NULL,
		Type							char(2) NULL
	)

	IF @CustomerAccount IS NOT NULL
	BEGIN
		INSERT INTO #WarrantySaleIds
			(id)
		SELECT 
			ws.Id
		FROM
			Warranty.WarrantySale ws
		WHERE
			ws.CustomerAccount = @CustomerAccount
			AND NOT EXISTS 
			(
				SELECT 1
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
	END
	ELSE
	BEGIN 
		INSERT INTO #WarrantySaleIds
			(id)
		SELECT 
			ws.Id
		FROM
			Warranty.WarrantySale ws
		WHERE
			ws.CustomerId = @CustomerId
			AND NOT EXISTS 
			(
				SELECT 1
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
	END

	--------------------------------------------------------------------------------------------
	---   I need to create the table before the if statement, otherwise it throws an error   ---
	--------------------------------------------------------------------------------------------
	SELECT 
		c.CustomerAccount,c.addtype, c.CustomerAddressLine1, c.CustomerAddressLine2, c.CustomerAddressLine3, c.CustomerFirstName, c.CustomerId, c.CustomerLastName, c.CustomerPostcode, c.CustomerTitle, c.CustomerNotes, 
		c.ItemDescription, ISNULL(c.ItemPrice, 0) AS ItemPrice, ISNULL(c.ItemCostPrice, 0) AS ItemCostPrice, c.ItemDeliveredOn, ISNULL( c.ItemId, 0 )AS ItemId, c.ItemNumber, c.ItemUPC, c.StockLocation, brn.BranchNameLong,
		c.ItemSupplier, c.SoldOn, ISNULL(c.SoldById, 0) AS SoldById, c.SoldBy, c.ItemSerialNumber, c.WarrantyGroupId, c.WarrantyNumber, c.WarrantyType, ISNULL(c.WarrantyLength, 0) AS WarrantyLength,  c.WarrantyContractNo,
		c.ManufacturerWarrantyNumber, c.ManufacturerWarrantyContractNo, c.ManufacturerWarrantyLength, c.WarrantySaleId
	INTO #ServiceData
	FROM 
		#x AS C 
		INNER JOIN Service.BranchLookup brn
		ON brn.branchno = c.StockLocation
	WHERE
		1 = 0 --to bring no data at all
	
--	-----------------------------------------------------------------------------------------------
--	---   Stores the data in a temp table. It is faster to filter by one condtion at the time   ---
--	-----------------------------------------------------------------------------------------------
	IF @CustomerAccount IS NOT NULL
	BEGIN
		INSERT INTO #x
			(WarrantySaleId, CustomerId, CustomerAccount, ItemId, ItemNumber, ItemPrice, ItemCostPrice, StockLocation, ItemDescription, ItemSupplier, ItemUPC, ItemDeliveredOn, WarrantyType, 
			 CustomerTitle, CustomerFirstName, CustomerLastName,addtype, CustomerAddressLine1, CustomerAddressLine2, CustomerAddressLine3, CustomerPostcode, SoldById, SoldBy, SoldOn, WarrantyNumber, 
			 WarrantyContractNo, WarrantyLength, WarrantyEffectiveDate, ManufacturerWarrantyNumber, ManufacturerWarrantyContractNo, ManufacturerWarrantyLength, CustomerNotes, ItemSerialNumber, 
			 WarrantyGroupId, Type)
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
			(select top 1 addtype from custaddress where custid=Ws.CustomerId and (cusaddr1 like '%'+wb.AddressLine1+'%' or cusaddr2 like '%'+wb.AddressLine2+'%')) as addtype ,
			wb.AddressLine1,
			wb.AddressLine2,
			wb.AddressLine3,
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
			SrI.Type
		FROM
			Warranty.WarrantySale AS Ws
			INNER JOIN #WarrantySaleIds ids
				ON ws.Id = ids.id
		inner join warehouse.booking as wb on wb.Acctno=Ws.CustomerAccount and wb.ItemNo=ws.ItemNumber
			INNER JOIN 
			(
				 SELECT
					MAX(Ws.Id) AS Maxid,
					Ws.CustomerAccount
				FROM 
					Warranty.WarrantySale AS Ws
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
					INNER JOIN lineitem l
						ON l.itemId = ws.ItemId
						AND l.acctno = ws.CustomerAccount
						AND l.stocklocn = ws.StockLocation
				WHERE l.quantity > 0
				GROUP BY Ws.CustomerAccount, Ws.ItemId, StockLocation, Ws.WarrantyGroupId
			) AS M
				ON M.Maxid = Ws.Id
				AND ws.CustomerAccount = M.CustomerAccount
			LEFT JOIN 
			(
				SELECT 
					ws.CustomerAccount, ws.WarrantyGroupId, ws.ItemId, ws.Id, ws.WarrantyType, ws.WarrantyNumber, ws.WarrantyLength, ws.Status, ws.WarrantyContractNo
				FROM 
					Warranty.WarrantySale ws
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) AS Ws1
				ON Ws.CustomerAccount = Ws1.CustomerAccount
				AND Ws.WarrantyGroupId = Ws1.WarrantyGroupId
				AND Ws.ItemId = Ws1.ItemId 
				AND Ws.Id != Ws1.Id
			LEFT OUTER JOIN 
			(
				SELECT DISTINCT
					Acctno,
					ContractNo,
					StockItemAcctno AS StockAcctno,
					OriginalContractno AS StockContractNo,
					ws.WarrantyNumber,
					ws.WarrantyLength
				FROM 
					WarrantyRenewalPurchase wrp
					INNER JOIN Warranty.WarrantySale ws
						ON ws.CustomerAccount = wrp.acctno
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) ren
				ON ren.acctno = Ws.CustomerAccount
				AND ren.Contractno = ws.WarrantyContractNo
			LEFT OUTER JOIN 
			(
				SELECT DISTINCT
					Acctno,
					ContractNo,
					StockItemAcctno AS StockAcctno,
					OriginalContractno AS StockContractNo,
					ws.WarrantyNumber,
					ws.WarrantyLength
				FROM 
					WarrantyRenewalPurchase wrp
					INNER JOIN Warranty.WarrantySale ws
						ON ws.CustomerAccount = wrp.acctno
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) AS orig
				ON orig.StockAcctno = Ws.CustomerAccount
				AND orig.StockContractNo = ws.WarrantyContractNo
			LEFT JOIN 
			(
				SELECT ItemNumber, WarrantyGroupId, Account, MAX(ItemSerialNumber) AS ItemSerialNumber
				FROM Service.Request
				GROUP BY ItemNumber, WarrantyGroupId, Account
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
			ws.CustomerAccount = @CustomerAccount
			AND C.Accttype != 's'
			AND NOT EXISTS (
				SELECT 1
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

		INSERT INTO #ServiceData
		SELECT 
			c.CustomerAccount, 
			c.addtype,

			c.CustomerAddressLine1, 
			c.CustomerAddressLine2, 
			c.CustomerAddressLine3, 
			c.CustomerFirstName, 
			c.CustomerId, 
			c.CustomerLastName, 
			c.CustomerPostcode, 
			c.CustomerTitle, 
			c.CustomerNotes, 
			CASE
				WHEN i.itemdescr1 IS NOT NULL THEN LTRIM(RTRIM(i.itemdescr1)) + LTRIM(RTRIM(i.itemdescr2))
				ELSE c.ItemDescription
			END AS ItemDescription,
			ISNULL(c.ItemPrice, 0) AS ItemPrice,
			ISNULL(c.ItemCostPrice, 0) AS ItemCostPrice,
			c.ItemDeliveredOn, 
			ISNULL( c.ItemId, 0 )AS ItemId, 
			c.ItemNumber, 
			c.ItemUPC,
			c.StockLocation,
			brn.BranchNameLong,
			c.ItemSupplier, 
			c.SoldOn,
			ISNULL(c.SoldById, 0) AS SoldById, 
			c.SoldBy,
			c.ItemSerialNumber, 
			c.WarrantyGroupId, 
			c.WarrantyNumber, 
			c.WarrantyType, 
			ISNULL(c.WarrantyLength, 0) AS WarrantyLength,  
			c.WarrantyContractNo,
			c.ManufacturerWarrantyNumber, 
			c.ManufacturerWarrantyContractNo,
			c.ManufacturerWarrantyLength, 
			c.WarrantySaleId
		FROM 
			#x AS C 
			INNER JOIN Service.BranchLookup brn
				ON brn.branchno = c.StockLocation
			LEFT JOIN StockInfo i
				ON c.ItemNumber = i.itemno
		WHERE
			C.CustomerAccount = @CustomerAccount
			AND (@Type <> 'II' OR (@Type = 'II' AND c.Type IS NULL))
			AND (
					(
						(ISNULL( C.WarrantyContractNo, '') != '' and C.WarrantyContractNo != N'MAN001') or (ISNULL( C.ManufacturerWarrantyContractNo, '') != '' and C.ManufacturerWarrantyContractNo != N'MAN001')
						
					 ) OR  ISNULL( C.ItemSerialNumber, '' ) != ''
					
				) 
			AND NOT EXISTS
			(
				SELECT 1 -- DISTINCT SR.WarrantyContractNo
				FROM Service.Request SR 
				WHERE C.ItemId = SR.ItemId
					AND C.CustomerAccount = SR.Account
					-- A Open SR (for internal item), can have its WarrantyContractNo NULL when it's no longer under warranty
					AND (SR.WarrantyContractNo IS NULL OR C.WarrantyContractNo=SR.WarrantyContractNo)
					AND SR.State != 'Closed'
			)
	END
	ELSE
	BEGIN
		INSERT INTO #x
			(WarrantySaleId, CustomerId, CustomerAccount, ItemId, ItemNumber, ItemPrice, ItemCostPrice, StockLocation, ItemDescription, ItemSupplier, ItemUPC, ItemDeliveredOn, WarrantyType, 
			 CustomerTitle, CustomerFirstName, CustomerLastName, addtype,CustomerAddressLine1, CustomerAddressLine2, CustomerAddressLine3, CustomerPostcode, SoldById, SoldBy, SoldOn, WarrantyNumber, 
			 WarrantyContractNo, WarrantyLength, WarrantyEffectiveDate, ManufacturerWarrantyNumber, ManufacturerWarrantyContractNo, ManufacturerWarrantyLength, CustomerNotes, ItemSerialNumber, 
			 WarrantyGroupId, Type)
		SELECT
			Ws.Id AS WarrantySaleId,
			Ws.CustomerId,
			Wb.Acctno,
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
			(select top 1  addtype from custaddress where custid=Ws.CustomerId and (cusaddr1 like '%'+wb.AddressLine1+'%' or cusaddr2 like '%'+wb.AddressLine2+'%')) as addtype ,
			wb.AddressLine1,
			wb.AddressLine2,
			wb.AddressLine3,
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
			SrI.Type
		FROM
			Warranty.WarrantySale AS Ws
			INNER JOIN #WarrantySaleIds ids
				ON ws.Id = ids.id
				inner join warehouse.booking as wb on wb.Acctno=Ws.CustomerAccount and wb.ItemNo=ws.ItemNumber
			INNER JOIN 
			(
				 SELECT
					MAX(Ws.Id) AS Maxid,
					Ws.CustomerAccount
				FROM 
					Warranty.WarrantySale AS Ws
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
					INNER JOIN lineitem l
						ON l.itemId = ws.ItemId
						AND l.acctno = ws.CustomerAccount
						AND l.stocklocn = ws.StockLocation
				WHERE l.quantity > 0
				GROUP BY Ws.CustomerAccount, Ws.ItemId, StockLocation, Ws.WarrantyGroupId
			) AS M
				ON M.Maxid = Ws.Id
				AND ws.CustomerAccount = M.CustomerAccount
			LEFT JOIN 
			(
				SELECT 
					ws.CustomerAccount, ws.WarrantyGroupId, ws.ItemId, ws.Id, ws.WarrantyType, ws.WarrantyNumber, ws.WarrantyLength, ws.Status, ws.WarrantyContractNo
				FROM 
					Warranty.WarrantySale ws
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) AS Ws1
				ON Ws.CustomerAccount = Ws1.CustomerAccount
				AND Ws.WarrantyGroupId = Ws1.WarrantyGroupId
				AND Ws.ItemId = Ws1.ItemId 
				AND Ws.Id != Ws1.Id
			LEFT OUTER JOIN 
			(
				SELECT DISTINCT
					Acctno,
					ContractNo,
					StockItemAcctno AS StockAcctno,
					OriginalContractno AS StockContractNo,
					ws.WarrantyNumber,
					ws.WarrantyLength
				FROM 
					WarrantyRenewalPurchase wrp
					INNER JOIN Warranty.WarrantySale ws
						ON ws.CustomerAccount = wrp.acctno
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) ren
				ON ren.acctno = Ws.CustomerAccount
				AND ren.Contractno = ws.WarrantyContractNo
			LEFT OUTER JOIN 
			(
				SELECT DISTINCT
					Acctno,
					ContractNo,
					StockItemAcctno AS StockAcctno,
					OriginalContractno AS StockContractNo,
					ws.WarrantyNumber,
					ws.WarrantyLength
				FROM 
					WarrantyRenewalPurchase wrp
					INNER JOIN Warranty.WarrantySale ws
						ON ws.CustomerAccount = wrp.acctno
					INNER JOIN #WarrantySaleIds ids
						ON ws.Id = ids.id
			) AS orig
				ON orig.StockAcctno = Ws.CustomerAccount
				AND orig.StockContractNo = ws.WarrantyContractNo
			LEFT JOIN 
			(
				SELECT ItemNumber, WarrantyGroupId, Account, MAX(ItemSerialNumber) AS ItemSerialNumber
				FROM Service.Request
				GROUP BY ItemNumber, WarrantyGroupId, Account
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
			ws.CustomerId = @CustomerId
			AND C.Accttype != 's'
			AND NOT EXISTS (
				SELECT 1
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

		INSERT INTO #ServiceData
		SELECT 
			c.CustomerAccount,
			c.addtype,
			c.CustomerAddressLine1, 
			c.CustomerAddressLine2, 
			c.CustomerAddressLine3, 
			c.CustomerFirstName, 
			c.CustomerId, 
			c.CustomerLastName, 
			c.CustomerPostcode, 
			c.CustomerTitle, 
			c.CustomerNotes, 
			CASE
				WHEN i.itemdescr1 IS NOT NULL THEN LTRIM(RTRIM(i.itemdescr1)) + LTRIM(RTRIM(i.itemdescr2))
				ELSE c.ItemDescription
			END AS ItemDescription,
			ISNULL(c.ItemPrice, 0) AS ItemPrice,
			ISNULL(c.ItemCostPrice, 0) AS ItemCostPrice,
			c.ItemDeliveredOn, 
			ISNULL(c.ItemId, 0) AS ItemId, 
			c.ItemNumber, 
			c.ItemUPC,
			c.StockLocation,
			brn.BranchNameLong,
			c.ItemSupplier, 
			c.SoldOn,
			ISNULL(c.SoldById, 0) AS SoldById, 
			c.SoldBy,
			c.ItemSerialNumber, 
			c.WarrantyGroupId, 
			c.WarrantyNumber, 
			c.WarrantyType, 
			ISNULL(c.WarrantyLength, 0) AS WarrantyLength,  
			c.WarrantyContractNo,
			c.ManufacturerWarrantyNumber, 
			c.ManufacturerWarrantyContractNo,
			c.ManufacturerWarrantyLength, 
			c.WarrantySaleId
		FROM 
			#x AS C 
			INNER JOIN Service.BranchLookup brn
			ON brn.branchno = c.StockLocation
			LEFT JOIN StockInfo i
				ON c.ItemNumber = i.itemno
		WHERE
			c.CustomerId = @CustomerId
			AND (@Type <> 'II' OR (@Type = 'II' AND c.Type IS NULL))
			AND (
					(
						((ISNULL( C.WarrantyContractNo, '') != '' and C.WarrantyContractNo != N'MAN001') or (ISNULL( C.ManufacturerWarrantyContractNo, '') != '' and C.ManufacturerWarrantyContractNo != N'MAN001'))
						
					) OR  ISNULL( C.ItemSerialNumber, '' ) != ''
				) 
			AND NOT EXISTS
			(
				SELECT 1 -- DISTINCT SR.WarrantyContractNo
				FROM Service.Request SR 
				WHERE C.ItemId = SR.ItemId
					AND C.CustomerAccount = SR.Account
					-- A Open SR (for internal item), can have its WarrantyContractNo NULL when it's no longer under warranty
					AND (SR.WarrantyContractNo IS NULL OR C.WarrantyContractNo=SR.WarrantyContractNo)
					AND SR.State != 'Closed'
			)
	END

	SELECT 
		c.CustomerAccount AS Account, 
		c.addtype,
		c.CustomerAddressLine1, 
		c.CustomerAddressLine2, 
		c.CustomerAddressLine3, 
		c.CustomerFirstName, 
		c.CustomerId, 
		c.CustomerLastName, 
		c.CustomerPostcode, 
		c.CustomerTitle, 
		c.CustomerNotes, 
		RTRIM(LTRIM(c.ItemDescription)) AS Item, 
		c.ItemPrice AS ItemAmount, 
		c.ItemCostPrice AS ItemCostPrice, 
		c.ItemDeliveredOn, 
		c.ItemId,
		c.ItemNumber, 
		c.ItemUPC AS Iupc, 
		c.StockLocation AS ItemStockLocation, 
		c.BranchNameLong AS ItemStockLocationName, 
		c.ItemSupplier, 
		c.SoldOn AS ItemSoldOn, 
		ISNULL(c.SoldById, 0) AS ItemSoldBy, 
		c.SoldBy AS ItemSoldByName, 
		c.ItemSerialNumber, 
		c.WarrantyGroupId, 
		c.WarrantyNumber, 
		c.WarrantyType, 
		ISNULL(c.WarrantyLength, 0) AS WarrantyLength,  
		c.WarrantyContractNo AS WarrantyContractNumber, 
		c.ManufacturerWarrantyNumber, 
		c.ManufacturerWarrantyContractNo AS ManufacturerWarrantyContractNumber, 
		c.ManufacturerWarrantyLength, 
		c.WarrantySaleId AS WarrantyContractId, 
		0 AS TotalRequests, 
		1 AS ItemCount
	FROM 
		#ServiceData C
	UNION 
	SELECT c.CustomerAccount AS Account, 
	c.addtype,
		c.CustomerAddressLine1, 
		c.CustomerAddressLine2, 
		c.CustomerAddressLine3, 
		c.CustomerFirstName, 
		c.CustomerId, 
		c.CustomerLastName, 
		c.CustomerPostcode, 
		c.CustomerTitle, 
		c.CustomerNotes, 
		CASE
			WHEN si.itemdescr1 IS NOT NULL THEN LTRIM(RTRIM(si.itemdescr1)) + LTRIM(RTRIM(si.itemdescr2))
			ELSE RTRIM(LTRIM(c.ItemDescription))
		END AS Item,
		ISNULL( c.ItemPrice, 0 )AS ItemAmount, 
		ISNULL( c.ItemCostPrice, 0 )AS ItemCostPrice, 
		c.ItemDeliveredOn, 
		ISNULL( c.ItemId, 0 )AS ItemId, 
		c.ItemNumber, 
		c.ItemUPC AS Iupc, 
		c.StockLocation AS ItemStockLocation, 
		brn.BranchNameLong AS ItemStockLocationName, 
		c.ItemSupplier, 
		c.SoldOn AS ItemSoldOn, 
		ISNULL( c.SoldById, 0 )AS ItemSoldBy, 
		c.SoldBy AS ItemSoldByName, 
		c.ItemSerialNumber, 
		NULL AS WarrantyGroupId, 
		c.WarrantyNumber, 
		c.WarrantyType, 
		ISNULL(c.WarrantyLength, 0) AS WarrantyLength,  
		c.WarrantyContractNo AS WarrantyContractNumber, 
		c.ManufacturerWarrantyNumber, 
		c.ManufacturerWarrantyContractNo AS ManufacturerWarrantyContractNumber, 
		c.ManufacturerWarrantyLength, 
		NULL AS WarrantyContractId, 
		I.TotalRequests, 
		I.ItemCount
	FROM 
		#x AS c 
		INNER JOIN Service.BranchLookup brn ON brn.branchno = c.StockLocation
		INNER JOIN Service.ItemsWithoutWarrantyView I ON I.ItemId = C.ItemId AND I.StockLocation = C.StockLocation AND I.CustomerId = C.CustomerId AND I.CustomerAccount = C.CustomerAccount
		LEFT JOIN StockInfo si ON c.ItemNumber = si.itemno
	WHERE
		(ISNULL( @CustomerId, '' ) = '' OR c.CustomerId = @CustomerId) 
		AND (ISNULL( @CustomerAccount, '' ) = '' OR C.CustomerAccount = @CustomerAccount) 
		AND (I.ItemCount > I.TotalRequests) 
		AND (@Type <> 'II' OR (@Type = 'II' AND c.Type IS NULL)) 
		AND (ISNULL( C.WarrantyContractNo, '' ) = '' OR C.WarrantyContractNo = N'MAN001' OR ISNULL( C.ItemSerialNumber, '' ) = '')
		AND NOT EXISTS(select 1 from #ServiceData sd
					where sd.CustomerAccount = c.CustomerAccount
					and sd.ItemId = c.ItemId
					and sd.StockLocation = c.StockLocation
					and sd.WarrantyGroupId = c.WarrantyGroupId)

	IF OBJECT_ID('tempdb..#ServiceData','U') IS NOT NULL 
		DROP TABLE #ServiceData

	IF OBJECT_ID('tempdb..#x','U') IS NOT NULL 
		DROP TABLE #x

	IF OBJECT_ID('tempdb..#y','U') IS NOT NULL 
		DROP TABLE #y
		
	IF OBJECT_ID('tempdb..#WarrantySaleIds','U') IS NOT NULL 
		DROP TABLE #WarrantySaleIds

END
GO
 