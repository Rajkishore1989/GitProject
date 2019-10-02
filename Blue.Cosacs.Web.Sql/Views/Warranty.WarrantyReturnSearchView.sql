IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warranty].[WarrantyReturnSearchView]'))
DROP VIEW [Warranty].[WarrantyReturnSearchView]
GO

CREATE VIEW [Warranty].[WarrantyReturnSearchView]
AS
SELECT     R.Id AS WarrantyReturnId, W.Number AS WarrantyNo, W.Description AS WarrantyDescription, T.Id AS TagId, T.Name AS Tag, L.Name AS [Level]
FROM         Warranty.Tag AS T LEFT OUTER JOIN
                      Warranty.[Level] AS L ON T.LevelId = L.Id RIGHT OUTER JOIN
                      Warranty.WarrantyReturnFilter AS F ON T.Id = F.TagId RIGHT OUTER JOIN
                      Warranty.WarrantyReturn AS R ON F.WarrantyReturnId = R.Id LEFT OUTER JOIN
                      Warranty.Warranty AS W ON R.WarrantyId = W.Id

GO
