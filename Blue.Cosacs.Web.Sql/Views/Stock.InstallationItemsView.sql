IF OBJECT_ID('Stock.InstallationItemsView') IS NOT NULL
	DROP VIEW Stock.InstallationItemsView
GO

CREATE VIEW Stock.InstallationItemsView
AS
SELECT
	item.itemno as ItemNumber,
	Installation.stocklocn as InstallationLocation,
	installation.ID, installation.itemno, installation.itemdescr1, installation.itemdescr2, installation.IUPC, installation.ItemID,
	installation.CostPrice, installation.unitpricecash, installation.unitpricehp, installation.taxrate
FROM dbo.StockInfo item
JOIN dbo.StockInfoAssociated link on 
	item.category = link.Category and 
	(item.Class = link.Class or link.Class = 'Any') and 
	(item.SubClass = link.SubClass or link.SubClass = 'Any')
JOIN dbo.StockItem installation on link.AssocItemId = installation.ItemID