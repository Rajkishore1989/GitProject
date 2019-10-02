IF OBJECT_ID('Warranty.ProductWarrantyLinkView') IS NOT NULL
	DROP VIEW Warranty.ProductWarrantyLinkView
GO

CREATE VIEW Warranty.ProductWarrantyLinkView
AS
	SELECT
		ROW_NUMBER() OVER (ORDER BY L.Id) AS Id,
		L.Id As LinkId,
		Lp.Storetype AS StoreType,
		Lp.Stockbranch AS StockBranch,
		Lp.Itemnumber AS ItemNumber,
		Lp.Refcode AS RefCode,
		Lp.Level_1 AS Level1,
		Lp.Level_2 AS Level2,
		Lp.Level_3 AS Level3,
		W.[Description] As WarrantyDescription,
		W.Id AS WarrantyId,
		w.TypeCode AS WarrantyTypeCode,
		W.Length AS WarrantyLenght,
		W.Number AS WarrantyNumber,
		W.Taxrate AS WarrantyTaxRange,
		L.Name AS LinkName,
		lw.ProductMin,
		lw.ProductMax,
		l.EffectiveDate
	FROM
		Warranty.Link AS L
		INNER JOIN Warranty.Linkwarranty AS Lw ON L.Id = Lw.Linkid
		INNER JOIN Warranty.Linkproduct AS Lp ON L.Id = Lp.Linkid
		INNER JOIN Warranty.Warranty AS W ON
		Lw.Warrantyid = W.Id
	WHERE 
		w.Deleted != 1