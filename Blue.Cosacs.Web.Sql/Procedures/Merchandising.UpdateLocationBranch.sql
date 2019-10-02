/*
* Hacky procedure to insert into dbo.Branch from Merchandising
*/

IF OBJECT_ID('Merchandising.UpdateLocationBranch') IS NOT NULL
	DROP PROCEDURE Merchandising.UpdateLocationBranch
GO

CREATE PROCEDURE Merchandising.UpdateLocationBranch
	@LocationId INT,
	@WorkPhone VARCHAR(30)-- work phone needs to be passed in as it's stored as JSON in the datebase :(
AS
BEGIN
	-- Can't use a merge statement because the dbo.branch table has database 'rules' which are not supported by MERGE
	SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
	BEGIN TRANSACTION;

	UPDATE b
	SET
		b.branchname = l.Name,
		b.branchaddr1 = l.AddressLine1,
		b.branchaddr2 = l.AddressLine2,
		b.branchaddr3 = l.City,
		b.branchpocode = l.PostCode,
		b.telno = @WorkPhone,
		b.StoreType = CASE WHEN l.Fascia = 'Courts' OR l.Fascia = 'Courts Optical' THEN 1 ELSE 0 END,
		LuckyDollarStore = CASE WHEN l.Fascia = 'Lucky Dollar' THEN 1 ELSE 0 END,
		AshleyStore = CASE WHEN l.Fascia = 'Ashley' THEN 1 ELSE 0 END,
		RadioShackStore = CASE WHEN l.Fascia = 'RadioShack' THEN 1 ELSE 0 END,
		DisplayType = CASE
			WHEN l.Fascia = 'Lucky Dollar' THEN 'LuckyDollar'
			WHEN l.Fascia = 'Ashley' THEN 'Ashley'
			WHEN l.Fascia = 'RadioShack' THEN 'RadioShack'
			ELSE 'Courts'
		END
	FROM
		Merchandising.[Location] l
		INNER JOIN dbo.Branch b ON b.branchno = l.SalesId
	WHERE l.Id = @LocationId
	IF @@ROWCOUNT = 0
	BEGIN
		INSERT INTO dbo.Branch
			( branchno,
			branchname,
			branchaddr1,
			branchaddr2,
			branchaddr3,
			branchpocode,
			telno,
			servpcent,
			countrycode,
			croffno,
			daterun,
			weekno,
			oldpctype,
			newpctype,
			datepcchange,
			batchctrlno,
			hissn,
			hibuffno,
			warehouseno,
			as400exp,
			hirefno,
			as400branchno,
			codreceipt,
			region,
			defaultdeposit,
			depositscreenlocked,
			servicelocation,
			highpicklistno,
			warehouseregion,
			dotnetforwarehouse,
			hightranschedno,
			StoreType,
			CreateRFAccounts,
			CreateCashAccounts,
			CreateHPAccounts,
			ScoreHPbefore,
			Fact2000BranchLetter,
			hiExtInvoiceNo,
			SRCashAndGoCustid,
			ServiceRepairCentre,
			BehaviouralScoring,
			ThirdPartyWarehouse,
			defaultPrintLocation,
			CreateStore,
			CashLoanBranch,
			LuckyDollarStore,
			AshleyStore,
			RadioShackStore,
			DisplayType)
		SELECT
			l.SalesId AS branchno,
			l.Name AS branchname,
			l.AddressLine1 AS branchaddr1,
			l.AddressLine2 AS branchaddr2,
			l.City AS branchaddr3,
			l.PostCode AS branchpocode,
			@WorkPhone AS telno,
			0 AS servpcent,
			(SELECT countrycode FROM country) AS countrycode,
			-- A = Any??
			l.SalesId AS croffno,
			GETDATE() AS daterun,
			0 AS weekno,
			'L' AS oldpctype,
			'L' AS newpctype,
			GETDATE() AS datepcchange,
			0 AS batchctrlno,
			0 AS hissn,
			0 AS hibuffno,
			'00' AS warehouseno,
			-- ???
			NULL AS as400exp,
			0 AS hirefno,
			l.SalesId AS as400branchno,
			0 AS codreceipt,
			'' AS region,
			'' AS defaultdeposit,
			0 AS depositscreenlocked,
			0 AS servicelocation,
			0 AS highpicklistno,
			'' AS warehouseregion,
			'Y' AS dotnetforwarehouse,
			0 AS hightranschedno,
			CASE WHEN l.Fascia = 'Courts' OR l.Fascia = 'Courts Optical' THEN 1 ELSE 0 END AS StoreType,
			0 AS CreateRFAccounts,
			0 AS CreateCashAccounts,
			0 AS CreateHPAccounts,
			0 AS ScoreHPbefore,
			'' AS Fact2000BranchLetter,
			1000000 AS hiExtInvoiceNo,
			0 AS SRCashAndGoCustid,
			--???
			0 AS ServiceRepairCentre,
			0 AS BehaviouralScoring,
			'N' AS ThirdPartyWarehouse,
			--???
			l.SalesId AS defaultPrintLocation,
			0 AS CreateStore,
			0 AS CashLoanBranch,
			CASE WHEN l.Fascia = 'Lucky Dollar' THEN 1 ELSE 0 END AS LuckyDollarStore,
			CASE WHEN l.Fascia = 'Ashley' THEN 1 ELSE 0 END AS AshleyStore,
			CASE WHEN l.Fascia = 'RadioShack' THEN 1 ELSE 0 END  AS RadioShackStore,
			CASE
					WHEN l.Fascia = 'Lucky Dollar' THEN 'LuckyDollar'
					WHEN l.Fascia = 'Ashley' THEN 'Ashley'
					WHEN l.Fascia = 'RadioShack' THEN 'RadioShack'
					ELSE 'Courts'
				END AS DisplayType
		FROM
			Merchandising.Location l
		WHERE l.Id = @LocationId
	END

	COMMIT TRANSACTION;
END