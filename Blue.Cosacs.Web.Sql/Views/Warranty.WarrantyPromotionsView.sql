IF OBJECT_ID('Warranty.WarrantyPromotionsView') IS NOT NULL
	DROP VIEW Warranty.WarrantyPromotionsView
GO

CREATE VIEW Warranty.WarrantyPromotionsView
AS
	SELECT 
		Data.StartDate,
		Data.EndDate,
		Data.PercentageDiscount,
		Data.RetailPrice,
		Data.BranchNumber,
		b.branchname AS BranchName,
		Data.BranchType,
		Data.warrantyId,
		w.Number AS WarrantyNumber,
		Data.WarrantyPriceId,
		Data.EffectiveDate AS WarrantyPriceEffectiveDate,
		ROW_NUMBER() OVER(ORDER BY Data.WarrantyPriceId) As RowKey,
		Data.WarrantyPromotionId
	FROM 
	(
		SELECT 
			WP.StartDate,
			WP.EndDate,
			WP.PercentageDiscount,
			WP.RetailPrice,
			WPr.BranchNumber,
			wpr.BranchType,
			WPr.warrantyId,
			WPr.EffectiveDate AS WarrantyPriceEffectiveDate,
			WPr.Id AS WarrantyPriceId,
			WPr.EffectiveDate,
			Wp.Id AS WarrantyPromotionId
		FROM
			Warranty.WarrantyPrice Wpr
			INNER JOIN Warranty.WarrantyPromotion Wp
				ON Wpr.WarrantyId = Wp.WarrantyId
				AND COALESCE(WPr.BranchType, WP.BranchType, 'ALL') = COALESCE(WP.BranchType, WPr.BranchType, 'ALL')
				AND COALESCE(Wpr.BranchNumber, WP.BranchNumber, -1) = COALESCE(WP.BranchNumber, Wpr.BranchNumber, -1)
		WHERE
			wp.EndDate >= WPr.EffectiveDate
	) AS Data
		LEFT JOIN branch b
			ON Data.BranchNumber = b.branchno
		INNER JOIN Warranty.Warranty w
			ON Data.WarrantyId = w.id
