-- **********************************************************************
-- Purpose: StockItem view for Service
-- 04/06/13  IP  #13735 - Return SparePart column
-- **********************************************************************

IF EXISTS (SELECT * FROM sys.objects so
		   INNER JOIN sys.schemas ss ON so.schema_id = ss.schema_id
		   WHERE so.type = 'V'
		   AND so.NAME = 'StockView'
		   AND ss.name = 'Service')
DROP VIEW  Service.[StockView]
GO 
 
CREATE VIEW Service.[StockView] 
AS   
SELECT 
    ISNULL(i.IUPC,i.itemno) as ItemNumber, 
    q.stocklocn as Location, 
    i.itemdescr1 as Description1,  
    i.itemdescr2 as Description2,    
    q.qtyAvailable AS StockOnHand,    
    p.CashPrice,ISNULL(p.CostPrice,0) as CostPrice,
    i.taxrate,
    i.Supplier,
    ISNULL(i.WarrantyLength,0) as WarrantyLength,
	q.deleted,
	i.SparePart									--#13735
    
    FROM StockInfo i INNER JOIN StockPrice p ON i.id = p.id 
    INNER JOIN StockQuantity Q ON p.id= q.id AND p.branchno= q.stocklocn
   
    
go
