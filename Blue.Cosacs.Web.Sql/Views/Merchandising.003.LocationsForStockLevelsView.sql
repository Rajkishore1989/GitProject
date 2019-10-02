IF EXISTS (SELECT * FROM sys.views WHERE name = 'LocationsForStockLevelsView')
DROP VIEW [Merchandising].[LocationsForStockLevelsView]
GO

CREATE VIEW [Merchandising].[LocationsForStockLevelsView]
AS
SELECT DISTINCT  'All' AS Id, 'All' AS LocationId, null AS SalesId, 'All Locations' AS Location, 'All' as Fascia, null AS Warehouse
FROM Merchandising.Location
UNION 
SELECT DISTINCT  'F' AS Id, 'F' AS LocationId, null AS SalesId, 'All '+Fascia AS Location, Fascia, null AS Warehouse
FROM Merchandising.Location
UNION 
SELECT DISTINCT  'W' AS Id, 'W' AS LocationId, null AS SalesId, 'All Warehouse' as Location, 'All', 1 AS Warehouse
FROM Merchandising.Location
WHERE Warehouse = 1
UNION
SELECT DISTINCT  'WF' AS Id, 'WF' AS LocationId, null AS SalesId, 'All '+Fascia+' Warehouse' as Location, Fascia, 1 AS Warehouse
FROM Merchandising.Location
WHERE Warehouse = 1



GO


