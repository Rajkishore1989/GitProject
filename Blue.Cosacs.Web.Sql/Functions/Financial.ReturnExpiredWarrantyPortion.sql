if object_id('Financial.ReturnExpiredWarrantyPortion') is not null
	DROP FUNCTION Financial.ReturnExpiredWarrantyPortion
GO

CREATE FUNCTION Financial.ReturnExpiredWarrantyPortion
(
    @SaleOrCostPrice	decimal (12,4),
    @DeliveredOn		date,
    @Date				smalldatetime,
    @WarrantyLength		smallint,
    @PercentageReturn	decimal (5,2)
)
RETURNS DECIMAL (12,4)
AS
BEGIN
    DECLARE @Result DECIMAL (12,4)

    RETURN @SaleOrCostPrice *
		CASE 
			WHEN dbo.FullMonthsDiff(@DeliveredOn, @Date) < 1 THEN 1 
			WHEN dbo.FullMonthsDiff(@DeliveredOn, @Date) <= @WarrantyLength THEN (100.0 - @PercentageReturn) / 100.0
			ELSE 0 
		END
END