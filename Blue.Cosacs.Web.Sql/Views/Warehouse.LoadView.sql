
IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[LoadView]'))
DROP VIEW [Warehouse].[LoadView]
GO

CREATE VIEW [Warehouse].[LoadView]  
AS  
SELECT         
  L.Id,
  L.CreatedOn,  
  D.Name AS DriverName,  
  C1.FullName AS CreatedByName,
  L.ConfirmedOn,
  C2.FullName AS ConfirmedByName,
  C1.[Login] AS CreatedByLogin,			-- #10199
  C2.[Login] AS ConfirmedByLogin		-- #10199
  
FROM Warehouse.Load L
LEFT JOIN Warehouse.Driver D ON D.Id = L.DriverId  
LEFT JOIN Admin.[User] C1 ON C1.id = L.CreatedBy  
LEFT JOIN Admin.[User] C2 ON C2.id = L.ConfirmedBy
GO


