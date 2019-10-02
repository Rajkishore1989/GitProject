IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warranty].[LinkWarrantyTypeView]'))
DROP VIEW [Warranty].[LinkWarrantyTypeView]
GO

CREATE VIEW [Warranty].[LinkWarrantyTypeView]
AS
SELECT DISTINCT L.Id, L.Name, LP.Level_1 AS Department, LP.Level_2 AS Category, LP.Level_3 AS Class, 
	LP.RefCode, LP.StoreType, LP.ItemNumber, LP.StockBranch, WType.TypeCode
FROM Warranty.Link AS L INNER JOIN
				(SELECT WL.LinkId, W.TypeCode
				FROM Warranty.LinkWarranty AS WL 
				LEFT OUTER JOIN Warranty.Warranty AS W ON WL.WarrantyId = W.Id
				WHERE W.TypeCode <> 'F') AS WType 
ON L.Id = WType.LinkId 
LEFT OUTER JOIN Warranty.LinkProduct AS LP 
ON L.Id = LP.LinkId

GO
