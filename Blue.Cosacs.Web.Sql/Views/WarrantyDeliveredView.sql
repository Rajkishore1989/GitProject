IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[WarrantyDeliveredView]'))
	DROP VIEW [dbo].[WarrantyDeliveredView]
GO

CREATE VIEW [dbo].[WarrantyDeliveredView] 
AS 
  WITH del (datedel, itemid, acctno, agrmtno, stocklocn, contractno) 
       AS (SELECT Max(datedel), 
                  itemid, 
                  acctno, 
                  agrmtno, 
                  stocklocn, 
                  contractno 
           FROM   delivery 
           WHERE  (SELECT Sum(quantity) 
                   FROM   delivery d2 
                   WHERE  d2.itemid = delivery.itemid 
                          AND d2.acctno = delivery.acctno 
                          AND d2.agrmtno = delivery.agrmtno 
                          AND d2.stocklocn = delivery.stocklocn 
                          AND d2.contractno = delivery.contractno) > 0 
                  AND delorcoll = 'D' 
           GROUP  BY itemid, 
                     acctno, 
                     agrmtno, 
                     stocklocn, 
                     contractno) 
  SELECT cast(ws.EffectiveDate as datetime) as EffectiveDate,
         cast(ws.ItemDeliveredOn as datetime) as ProductDeliveryDate,
         d.itemid as ItemId, 
         d.contractno, 
         d.stocklocn, 
         isnull(s.warrantylength,ws.WarrantyLength) AS warrantyLength, 
         ca.custid,
         parent.acctno,
         isnull(parent.itemno,'') AS parentItemNumber,
         isnull(parent.stocklocn,0) AS parentStockLocation,
		 ISNULL(parent.ItemID,0) AS parentItemId,
		 l.itemno AS Itemno,
		 s.itemdescr1 AS [Description],
		 a.currstatus,						-- 14890
		 cast(ws.WarrantyDeliveredOn as datetime) as WarrantyDeliveredDate,
         wsf.WarrantyLength as FreeWarrantyLength
  FROM   custacct ca 
		 INNER JOIN acct a ON a.acctno = ca.acctno			-- 14890
         INNER JOIN lineitem l ON l.acctno = ca.acctno 
         LEFT JOIN lineitem parent on l.acctno = parent.acctno
                                       AND l.agrmtno = parent.agrmtno
                                       AND l.parentItemId = parent.itemId
                                       AND l.parentlocation = parent.stocklocn
         INNER JOIN stockinfo s ON s.id = l.itemid 
         INNER JOIN del d ON d.acctno = l.acctno 
                    AND d.agrmtno = l.agrmtno 
                    AND d.stocklocn = l.stocklocn 
                    AND d.itemid = l.itemid 
                    AND d.contractno = l.contractno 
		 INNER JOIN Warranty.WarrantySale ws ON d.contractno = ws.WarrantyContractNo
         LEFT JOIN warranty.WarrantySale wsf 
            ON wsf.CustomerAccount = ws.CustomerAccount
            and wsf.ItemId = ws.ItemId
            and wsf.StockLocation = ws.StockLocation
            and wsf.WarrantyGroupId = ws.WarrantyGroupId
            and wsf.WarrantyType = 'F'
  WHERE  category IN ( 12, 82 ) AND ISNULL(s.WarrantyType, 'E') <> 'F' --exclude free warranty 
GO