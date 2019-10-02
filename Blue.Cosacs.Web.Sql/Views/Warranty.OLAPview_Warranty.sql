IF OBJECT_ID('Warranty.OLAPview_Warranty') IS NOT NULL
	DROP VIEW Warranty.OLAPview_Warranty
GO

CREATE VIEW Warranty.OLAPview_Warranty
AS
	SELECT 
		w.id AS WarrantyId,
		w.Number,
		w.Description,
		w.Length,
		CASE
			WHEN w.TypeCode = 'F' THEN 'Free'
			WHEN w.TypeCode = 'E' THEN 'Extended'
			ELSE 'Instant Replacement'
		END AS Type,
		ISNULL(Prices.Price, 0) AS WarrantyPrice
	FROM 
		Warranty.Warranty w
		LEFT JOIN 
		(
			SELECT 
				w.WarrantyId,
				w.RetailPrice AS Price
			FROM 
				Warranty.WarrantyPrice w 
				INNER JOIN 
				(
					SELECT MAX(w.Id) AS MaxId
					FROM Warranty.WarrantyPrice w 
					WHERE w.BulkEditId IS NULL AND w.EffectiveDate <= getdate()
					GROUP BY w.WarrantyId
				) AS MaxPrices
					ON w.id = MaxPrices.MaxId
			WHERE 
				w.BulkEditId IS NULL
		) Prices
			ON w.Id = Prices.WarrantyId

	