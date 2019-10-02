IF OBJECT_ID('Financial.ProcessMessageWarranty') IS NOT NULL
	DROP PROCEDURE Financial.ProcessMessageWarranty
GO
  
CREATE PROCEDURE Financial.ProcessMessageWarranty
	@Id		Int,
	@Body	XML,
	@Date	SmallDateTime = NULL
AS
	SET NOCOUNT ON

	--Saves the original value
	DECLARE @ArithabortState Int = 64 & @@OPTIONS
    DECLARE @decimalPlaces SMALLINT

    SELECT @decimalPlaces = ISNULL(SUBSTRING(decimalplaces,2,1),0) FROM country --Country decimal places for rounding

	DELETE Financial.[Transaction] WHERE MessageId = @Id
	DELETE Financial.WarrantyMessage WHERE MessageId = @Id

	IF @Date IS NULL
		SET @Date = GETDATE()
		
	SET ARITHABORT ON;

	WITH XMLNAMESPACES(default 'http://www.bluebridgeltd.com/cosacs/2012/schema.xsd')
	INSERT INTO Financial.WarrantyMessage
		(ContractNumber, DeliveredOn, AccountType, Department, SalePrice, CostPrice, BranchNo, WarrantyNo, WarrantyLength, MessageId, TaxRate, AccountNumber)
	SELECT 
		w.value('ContractNumber[1]', 'VarChar(255)') AS ContractNumber,
		SalesOrder.XMlValue.value('/SalesOrder[1]/DeliveredOn[1]', 'date') AS DeliveredOn,
		SalesOrder.XMlValue.value('/SalesOrder[1]/Customer[1]/AccountType[1]', 'VarChar(255)') AS AccountType,
		w.value('Department[1]', 'VarChar(255)') AS Department,
		w.value('SalePrice[1]', 'float') AS SalePrice,
		w.value('CostPrice[1]', 'float') AS CostPrice,
		LEFT(SalesOrder.XMlValue.value('/SalesOrder[1]/Customer[1]/AccountNumber[1]', 'VarChar(255)'), 3) AS BranchNo,
		w.value('Number[1]', 'varchar(20)') AS WarrantyNo,
		w.value('Length[1]', 'smallint') AS WarrantyLength,
		@Id AS MessageId,
		w.value('TaxRate[1]', 'BlueAmount') AS TaxRate,
		SalesOrder.XMlValue.value('/SalesOrder[1]/Customer[1]/AccountNumber[1]', 'VarChar(255)') AS AccountNumber
	FROM
	(
		SELECT @Body AS XMlValue
	) AS SalesOrder
	CROSS APPLY SalesOrder.XMlValue.nodes('/SalesOrder/Item/Warranty') AS Warranty(w)

	--------------------------------------------------------------
	-----   Now insert the values into the transaction table   ---
	--------------------------------------------------------------

	DECLARE @stockTaxType Bit, @agreementTaxType Char(1)
	SELECT @stockTaxType = ISNULL((SELECT c.ValueBit FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising'), 0)
    SELECT @agreementTaxType = ISNULL((select c.Value from Config.SettingView c where c.CodeName = 'agrmttaxtype'),'E')


	INSERT INTO Financial.[Transaction]
		(Account, BranchNo, [Type], Amount, [Date], MessageId, Description)
	SELECT
		w.Account,
		wm.BranchNo,
		w.TransactionType AS [Type],
        CASE 
            WHEN w.CalculateTax = 0 THEN
		        CASE 
                    WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'I' AND @stockTaxType = 0 THEN  SalePrice -  ROUND(SalePrice - (SalePrice * 100) / (100 + wm.TaxRate), @decimalPlaces)
                    WHEN w.CostOrSale = 'Sale' AND  @agreementTaxType = 'I' AND @stockTaxType = 1 THEN SalePrice -  ROUND(SalePrice - (SalePrice * 100) / (100 + wm.TaxRate), @decimalPlaces)
			        WHEN w.CostOrSale = 'Sale' AND  @agreementTaxType = 'E' AND @stockTaxType = 1 THEN SalePrice
                    WHEN w.CostOrSale = 'Sale' AND  @agreementTaxType = 'E' AND @stockTaxType = 0 THEN SalePrice
			        ELSE wm.CostPrice 
		        END
            ELSE    --Calculate Tax
                CASE 
					WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'I' AND @stockTaxType = 0 THEN  ROUND(SalePrice - (SalePrice * 100) / (100 + wm.TaxRate), @decimalPlaces)
                    WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'I' AND @stockTaxType = 1 THEN  ROUND(SalePrice - (SalePrice * 100) / (100 + wm.TaxRate), @decimalPlaces)
                    WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'E' AND @stockTaxType = 1 THEN ROUND(SalePrice * (wm.TaxRate / 100), @decimalPlaces)
                    WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'E' AND @stockTaxType = 0 THEN ROUND(SalePrice * (wm.TaxRate / 100), @decimalPlaces)
					ELSE wm.CostPrice 
                END 
        END 
		*     
		CASE 
			WHEN w.CalculateAmount = 1 THEN w.Percentage 
			ELSE 1 
		END AS Amount,
		@Date AS [Date],
		@Id AS MessageId,
		wm.AccountNumber + ': Warranty Sale ' + wm.ContractNumber AS Description
	FROM Financial.WarrantyMessage wm
		INNER JOIN Financial.TransactionMappingWarranty w
		ON
		(
			(CASE wm.AccountType
					WHEN 'C' THEN 'Cash'
					WHEN 'S' THEN 'Cash'
				ELSE 'Credit'
			END) = w.AccountType
			OR w.AccountType = '*'
		)
			AND w.Department = wm.Department
			AND w.Cancelation = 0
			AND w.Repossession = 0
			AND wm.MessageId = @Id

	IF (@ArithabortState & 64) = 64
		SET ARITHABORT ON
	ELSE
		SET ARITHABORT OFF