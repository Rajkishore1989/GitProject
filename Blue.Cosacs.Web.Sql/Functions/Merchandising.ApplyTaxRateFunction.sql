
IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'FN'
		   AND so.NAME = 'ApplyTaxRateFunction'
		   AND ss.name = 'Merchandising')
DROP FUNCTION [Merchandising].[ApplyTaxRateFunction]
GO

CREATE FUNCTION [Merchandising].[ApplyTaxRateFunction]
   (@Price decimal(15,4), @TaxRate decimal(15,4))
RETURNS decimal(15,4)
AS
BEGIN
	DECLARE @InclusivePrice decimal(15,4)
	Declare @PriceIncTax bit

	select @PriceIncTax = ValueBit 
	from config.Setting 
	where [namespace] = 'Blue.Cosacs.Merchandising' 
		and Id = 'TaxInclusive'

	IF (@PriceIncTax is null)
		SET @PriceIncTax = 0

	IF(@PriceIncTax = 1)
	BEGIN
		set @inclusivePrice = @price * (1+@TaxRate)
	END
	ELSE
	BEGIN
		set @inclusivePrice = @price
	END

	IF(@inclusivePrice IS NULL)
		SET @inclusivePrice = 0	
		
	RETURN @inclusivePrice

END


GO
