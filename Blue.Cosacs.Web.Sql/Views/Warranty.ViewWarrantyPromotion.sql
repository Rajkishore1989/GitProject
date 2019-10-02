IF OBJECT_ID('Warranty.ViewWarrantyPromotion') IS NOT NULL
	DROP VIEW Warranty.ViewWarrantyPromotion
GO

CREATE VIEW Warranty.ViewWarrantyPromotion
AS
	SELECT
		p.Id,
		p.BranchType,
		ISNULL(CONVERT(VarChar, p.BranchNumber), '') AS BranchNumber,
		w.Id AS WarrantyId,
		w.Number AS WarrantyNumber,
		p.StartDate,
		p.EndDate,
		p.PercentageDiscount,
		p.RetailPrice
	FROM
		Warranty.WarrantyPromotion p
		INNER JOIN Warranty.Warranty w
			ON p.WarrantyId = w.Id