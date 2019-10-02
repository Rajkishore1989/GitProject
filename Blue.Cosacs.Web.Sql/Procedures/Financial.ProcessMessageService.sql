IF OBJECT_ID('Financial.ProcessMessageService') IS NOT NULL
	DROP PROCEDURE Financial.ProcessMessageService
GO

CREATE PROCEDURE Financial.ProcessMessageService
	@Id		Int,
	@Body	XML,
	@Date	SmallDateTime
AS
	SET NOCOUNT ON

	--Saves the original value
	DECLARE @ArithabortState	Int = 64 & @@OPTIONS
	DECLARE @stockTaxType		Char(1)
	DECLARE @Tax				Decimal(5, 2)

	SET ARITHABORT ON;

	IF OBJECT_ID('tempdb..#Data') IS NOT NULL
		DROP TABLE #Data

	DELETE Financial.[Transaction] WHERE MessageId = @Id;
	
    SELECT @Tax = CONVERT(Decimal(5, 2), Rate)
    FROM [Merchandising].[TaxRate] t
    WHERE t.ProductId IS NULL
        AND t.EffectiveDate = (SELECT MAX(EffectiveDate) 
                               FROM Merchandising.TaxRate 
                               WHERE ProductId IS NULL
                                   AND EffectiveDate <= @Date)

	SELECT @stockTaxType = COALESCE
						   (
								(SELECT c.ValueString FROM Config.Setting c WHERE c.Id = 'TaxType' AND c.Namespace = 'Blue.Cosacs.Sales'), 
								(SELECT Value FROM config.SettingView v WHERE v.CodeName = 'TaxType'),
								'E'
						   )

	;WITH XMLNAMESPACES(default 'http://www.bluebridgeltd.com/cosacs/2012/schema.xsd'),
	Data(ChargeType, Label, ServiceType,  IsExternal, Replacement, Department, Cost, Value, BranchNo, AccountNo, ServiceRequestNo)
	AS
	(
		SELECT
			c.value('ChargeType[1]', 'varchar(50)') AS ChargeType,
			c.value('Label[1]', 'varchar(50)') AS Label,
			Charges.XMLMessage.value('/ServiceDetail[1]/RequestType[1]', 'VarChar(50)') as ServiceType,
            c.value('IsExternal[1]', 'bit') as IsExternal,
            Charges.XMLMessage.value('/ServiceDetail[1]/ReplacementIssued[1]', 'bit') AS Replacement,
            Charges.XMLMessage.value('(/ServiceDetail/Item/Hierarchy/Level[@name="Department"])[1]', 'varchar(100)') as Department,
			c.value('Cost[1]', 'float') as Cost,
			c.value('Value[1]', 'float') as Value,
			Charges.XMLMessage.value('/ServiceDetail[1]/Branch[1]', 'smallint') as BranchNo,
			Charges.XMLMessage.value('/ServiceDetail[1]/AccountNumber[1]', 'varchar(20)') as AccountNo,
			Charges.XMLMessage.value('/ServiceDetail[1]/ServiceRequestNo[1]', 'varchar(20)') as ServiceRequestNo
		FROM  
			(
				SELECT @Body AS XMLMessage
			) AS Charges
			CROSS APPLY Charges.XMLMessage.nodes('/ServiceDetail/Charges/Charge') AS Charge(c)
	)
	SELECT 
		t.Account,
		d.BranchNo,
		t.TransactionType AS [Type],
		CASE	
			WHEN UseValueColumn = 0 
			THEN d.Cost
			ELSE d.Value
		END * t.Percentage AS Amount,
		GETDATE() AS [Date],
		@Id AS MessageId,
		d.AccountNo + ': Service Request ' + d.ServiceRequestNo as Description
	INTO #Data
	FROM Data d
		LEFT JOIN Financial.AccountView A
			ON d.AccountNo = A.AccountNo
		INNER JOIN Financial.TransactionMappingService t
			ON t.ChargeType = d.ChargeType
			AND (t.Label = '*'			 OR t.Label = d.Label)
			AND (t.ServiceType = '*'     OR t.ServiceType = d.ServiceType)
			AND (t.IsExternal IS NULL    OR t.IsExternal  = d.IsExternal)
			AND (t.Replacement IS NULL   OR t.Replacement = d.Replacement)
		AND
		(
			t.CashNotCredit IS NULL
			OR A.AccountType IS NULL
			OR
			(
				CASE A.AccountType
																		WHEN 'C' THEN 1 
																		WHEN 'S' THEN 1 
					ELSE 0
				END
			) = t.CashNotCredit
		)
			AND (t.Department = '*'    OR t.Department  = d.Department)

	INSERT INTO Financial.[Transaction]
		(Account, BranchNo, [Type], Amount, [Date], MessageId, Description)
	SELECT 
		Account, BranchNo, [Type], Amount, [Date], MessageId, Description
	FROM #Data

	DROP TABLE #Data

	IF (@ArithabortState & 64) = 64
		SET ARITHABORT ON
	ELSE
		SET ARITHABORT OFF