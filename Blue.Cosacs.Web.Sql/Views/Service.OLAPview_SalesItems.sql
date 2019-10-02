IF OBJECT_ID('Service.OLAPview_SalesItems') IS NOT NULL
    DROP VIEW [Service].OLAPview_SalesItems
GO

CREATE VIEW [Service].OLAPview_SalesItems
AS
    SELECT
        ROW_NUMBER() OVER(ORDER BY d.datetrans) AS Id,
        CASE
            WHEN d.delorcoll='D' THEN 'Delivery'
            WHEN d.delorcoll='C' THEN 'Collection'
            WHEN d.delorcoll='R' AND d.transvalue>0 THEN 'Redelivery'
            WHEN d.delorcoll='R' AND (d.transvalue<0 OR d.quantity<0) THEN 'Repossession'
            ELSE 'NA'
        END AS DeliveryOrCollection,
        CASE
            WHEN d.itemno='ADMIN' THEN 'Service'
            WHEN d.itemno='ADM' THEN 'Service'
            WHEN d.itemno='LOAN' THEN 'Service'
            WHEN d.itemno='SC' THEN 'Service'
            WHEN d.itemno='TDC' THEN 'Service'
            ELSE 'Product'
        END ItemType,
        d.ItemID AS ItemId,
        d.itemno AS ItemNumber,
        c.category AS ItemCategory,
        c.code AS ItemCode,
        d.acctno AS AccountNumber,
        d.agrmtno AS AgreementNumber,
        d.delorcoll AS LineType,
        d.stocklocn AS StockLocation,
        d.quantity AS Quantity,
        d.transvalue AS TransactionValue,
        d.datetrans AS TransactionDate
    FROM delivery d
    INNER JOIN StockInfo i --Everything that can be sold will be on 'StockInfo'
        ON d.ItemID=i.Id
        AND d.itemno=i.itemno
    INNER JOIN code c
        ON CONVERT(VARCHAR(125), i.category)=c.code
        AND c.statusflag='L'
        AND c.category IN ('PCE', 'PCW', 'PCF', 'PCO')
    WHERE
        d.itemno NOT IN (
            'DT',        -- DEFERRED TERMS
            'RB', 'REB', -- REBATE
            'STAX'       -- GENERAL SALES TAX
        )
        AND c.code IS NOT NULL -- exclude old non classified items
        AND i.category IS NOT NULL AND i.category!=0 -- exclude old hacked items or non valid sale items
        AND d.delorcoll!='' -- exclude old items with errors (the delorcoll column cannot be empty)
        AND d.quantity!=0 AND d.transvalue!=0 -- exclude non valid sale items

