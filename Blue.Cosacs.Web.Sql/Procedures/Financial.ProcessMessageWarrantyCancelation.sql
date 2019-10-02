IF OBJECT_ID('Financial.ProcessMessageWarrantyCancelation') IS NOT NULL
	DROP PROCEDURE Financial.ProcessMessageWarrantyCancelation
GO

CREATE PROCEDURE Financial.ProcessMessageWarrantyCancelation
	@Id		Int,
	@Body	XML,
	@Date	SmallDateTime = NULL
AS
	--Saves the original value
	DECLARE @ArithabortState Int = 64 & @@OPTIONS, @IsFreeWarranty BIT

    DECLARE @decimalPlaces SMALLINT

    SELECT @decimalPlaces = ISNULL(SUBSTRING(decimalplaces,2,1),0) FROM country --Country decimal places for rounding


	DELETE  Financial.[Transaction]
	WHERE
		MessageId = @Id
		
	IF @Date IS NULL
		SET @Date = GETDATE()

	SET ARITHABORT ON

	IF OBJECT_ID('tempdb..#Data') IS NOT NULL
		DROP TABLE #Data

	-------------------------------------------------
	---   Test if the warranty message is there   ---
	-------------------------------------------------

	;WITH XMLNAMESPACES(default 'http://www.bluebridgeltd.com/cosacs/2012/schema.xsd')
	SELECT 
		SalesOrder.XMlValue.value('/SalesOrderCancel[1]/ContractNumber[1]', 'varchar(50)') AS ContractNumber,
		ISNULL(SalesOrder.XMlValue.value('/SalesOrderCancel[1]/IsRepossessed[1]', 'bit'), 0) AS IsRepossessed,
		SalesOrder.XMlValue.value('/SalesOrderCancel[1]/SaleBranch[1]', 'varchar(3)') AS SaleBranch,
		SalesOrder.XMlValue.value('/SalesOrderCancel[1]/CancelledDate[1]', 'varchar(10)') AS CancelledDate
	INTO #Data
	FROM
		(
			SELECT @Body AS XMlValue
		) AS SalesOrder

	SET @IsFreeWarranty =
		isnull(
			(
				SELECT 1
				FROM #Data d
				INNER JOIN Warranty.WarrantySale ws
					ON ws.WarrantyContractNo = d.ContractNumber
				WHERE ws.WarrantyType = 'F'
			 ),
		0)

    --Poison message should not occurr for Free Warranties as Return Percentages are not generally setup for free warranties
	IF NOT EXISTS(SELECT 1 FROM Financial.WarrantyReturnView wm where wm.ContractNumber in (select ContractNumber from #Data))
        AND @IsFreeWarranty = 0
	BEGIN 
		DROP TABLE #Data

       IF (@ArithabortState & 64) = 64
		    SET ARITHABORT ON
	    ELSE
		    SET ARITHABORT OFF

		RAISERROR ('Cound not find warranty message on Financial.WarrantyReturnView', 16, 1); 
		RETURN
	END

	DECLARE @stockTaxType Bit, @agreementTaxType Char(1)
	SELECT @stockTaxType = ISNULL((SELECT c.ValueBit FROM Config.Setting c WHERE c.Id = 'TaxInclusive' AND c.Namespace = 'Blue.Cosacs.Merchandising'), 0)
    SELECT @agreementTaxType = ISNULL((select c.Value from Config.SettingView c where c.CodeName = 'agrmttaxtype'),'E')

    IF(@IsFreeWarranty = 0)
    BEGIN
	    INSERT INTO Financial.[Transaction]
			(Account, BranchNo, [Type], Amount, [Date], MessageId, Description)
		SELECT Account, BranchNo, [Type], Amount, [Date], MessageId, Description
		FROM 
		(
	    SELECT 
		    w.Account, 
		    wm.BranchNo,  
		    w.TransactionType AS [Type],
            CASE
                WHEN w.CalculateTax = 0 THEN
					CASE 
						WHEN w.CalculateAmount = 1 THEN w.Percentage *
					        CASE 
						        WHEN w.CostOrSale = 'Sale' THEN  --CRE/CRF
									CASE
                                        WHEN c.ContractNo is null THEN --Calculate CRE/CRF
									        CASE
										        WHEN @agreementTaxType = 'E' AND @stockTaxType = 0 THEN
											ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn),@decimalPlaces) 
                                                WHEN @agreementTaxType = 'E' AND @stockTaxType = 1 THEN
                                            ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn),@decimalPlaces) 
                                                WHEN @agreementTaxType = 'I' AND @stockTaxType = 1 THEN
											ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) 
											- ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) 
											- (Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * 100) / (100 + wm.TaxRate), @decimalPlaces), @decimalPlaces)
                                                WHEN @agreementTaxType = 'I' AND @stockTaxType = 0 THEN
                                            ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) 
											- ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) 
											- (Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * 100) / (100 + wm.TaxRate), @decimalPlaces), @decimalPlaces)
                                        ELSE
                                            ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn),@decimalPlaces)  
                                     END       
                                        ELSE 0 -- Dno not calculate CRE/CRF
					        END
			            ELSE 
                                    CASE    -- This is for 'Cost' and 'COW'
                                        WHEN c.ContractNo is null THEN 
                                            ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.CostPrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn),@decimalPlaces)
                                        ELSE 0 -- Do not calculate COW
                                    END
							END
						ELSE w.Percentage *
							CASE 
								WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'E' AND @stockTaxType = 0 THEN wm.SalePrice
                                WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'E' AND @stockTaxType = 1 THEN wm.SalePrice 
								WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'I' AND @stockTaxType = 1 THEN ROUND(wm.SalePrice -  ROUND(wm.SalePrice-(wm.SalePrice*100)/(100 + wm.TaxRate), @decimalPlaces), @decimalPlaces)
                                WHEN w.CostOrSale = 'Sale' AND @agreementTaxType = 'I' AND @stockTaxType = 0 THEN ROUND(wm.SalePrice -  ROUND(wm.SalePrice-(wm.SalePrice*100)/(100 + wm.TaxRate), @decimalPlaces), @decimalPlaces)
								ELSE wm.CostPrice 
							END
		        END 
                ELSE --Calculate Tax
                    CASE
						WHEN w.CalculateAmount = 1 THEN w.Percentage *
                            CASE
                                WHEN w.CostOrSale = 'Sale' THEN
                                    CASE
                                        WHEN @agreementTaxType = 'E' AND @stockTaxType = 0 THEN ROUND(wm.SalePrice * (wm.TaxRate / 100), @decimalPlaces)
                                        WHEN @agreementTaxType = 'E' AND @stockTaxType = 1 THEN ROUND(wm.SalePrice * (wm.TaxRate / 100), @decimalPlaces)
                                        WHEN @agreementTaxType = 'I' AND @stockTaxType = 1 THEN ROUND(wm.SalePrice-(wm.SalePrice*100)/(100 + wm.TaxRate), @decimalPlaces) --Tax Inclusive
                                        WHEN @agreementTaxType = 'I' AND @stockTaxType = 0 THEN ROUND(wm.SalePrice-(wm.SalePrice*100)/(100 + wm.TaxRate), @decimalPlaces)  
                                        ELSE  ROUND(wm.SalePrice * (wm.TaxRate / 100), @decimalPlaces)
                                    END
                                ELSE
                                    CASE
										WHEN (w.CostOrSale = 'CRE' or w.CostOrSale = 'CRF') and c.ContractNo is null  THEN --Calculate BTX on CRE/CRF
                                            CASE
												WHEN @agreementTaxType = 'E' AND @stockTaxType =0 THEN
                                                    ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * (wm.TaxRate / 100), @decimalPlaces)
                                                WHEN @agreementTaxType = 'E' AND @stockTaxType = 1 THEN
                                                    ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * (wm.TaxRate / 100), @decimalPlaces)
												WHEN @agreementTaxType = 'I' AND @stockTaxType = 1 THEN --Tax Inclusive 
                                                    ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn)
													-(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn, @Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * 100) / (100 + wm.TaxRate), @decimalPlaces)
                                                WHEN @agreementTaxType = 'I' AND @stockTaxType = 0 THEN
                                                     ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn)
													-(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn, @Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * 100) / (100 + wm.TaxRate), @decimalPlaces)
                                                ELSE 
                                                    ROUND(Financial.[ReturnExpiredWarrantyPortion](wm.SalePrice,wm.DeliveredOn,@Date,wm.WarrantyLength + wm.FreeWarrantyLength,PercentageReturn) * (wm.TaxRate / 100), @decimalPlaces)
                                            END
                                            ELSE 0
                                    END
						    END
                         ELSE NULL -- THere are no current rules for this scenario IE Calculate tax = 1 && calculateAmount = 0
                    END
			END AS Amount,
			GETDATE() AS [Date],
			@Id AS MessageId,
			d.ContractNumber + ': Warranty Cancellation' AS Description
		FROM #Data d
		    INNER JOIN Financial.WarrantyReturnView wm
			    ON wm.ContractNumber = d.ContractNumber
			    AND [Level] = (select max([Level]) from Financial.WarrantyReturnView wm2 where wm.Id = wm2.Id)
		    INNER JOIN Financial.TransactionMappingWarranty w
			    ON ((CASE wm.AccountType 
					    WHEN 'C' THEN 'Cash'
					    WHEN 'S' THEN 'Cash'
					    ELSE 'Credit' END) = w.AccountType OR w.AccountType = '*')
			    AND w.Department = wm.Department
			    AND w.Cancelation = 1
			    AND w.Repossession = d.IsRepossessed
			    AND wm.ElapsedMonths = CASE
										    WHEN dbo.FullMonthsDiff(wm.DeliveredOn, @Date) < 1 THEN 1
										    ELSE dbo.FullMonthsDiff(wm.DeliveredOn, @Date) 
								       END
        LEFT JOIN IgnoreCRECRF c ON c.contractno = d.ContractNumber AND c.StockLocn = d.SaleBranch) AS Base
		WHERE Amount != 0

		DELETE c
		FROM IgnoreCRECRF c
		WHERE EXISTS (SELECT 1 
		              FROM #data d
					  WHERE  c.contractno = d.ContractNumber AND c.StockLocn = d.SaleBranch)

	    IF (@ArithabortState & 64) = 64
		    SET ARITHABORT ON
	    ELSE
		    SET ARITHABORT OFF

	    DROP TABLE #Data

	END

