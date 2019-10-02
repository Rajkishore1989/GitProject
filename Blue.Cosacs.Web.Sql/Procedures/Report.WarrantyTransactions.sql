
if object_id('[Report].WarrantyTransactions') IS NOT NULL
    DROP PROCEDURE [Report].WarrantyTransactions
GO

CREATE PROCEDURE [Report].WarrantyTransactions
    @runNo smallint=null
as

    SELECT
        'D' as [RowType],
        Account,
        cast(BranchNo as varchar(3)) as [Branch Number],
        [Type] as [Transaction Type],
        Amount,
        convert(varchar(10),[Date], 103) as [Transaction Date]
    INTO
        #WarrantyTransactions
    FROM
        Financial.[Transaction]
    WHERE
        RunNo = @runNo
    ORDER BY id

    IF @@ROWCOUNT > 0
    BEGIN
        insert into 
            #WarrantyTransactions
        select 
            'T','Totals','','',sum(wt.[Amount]), ''
        from 
            #WarrantyTransactions wt
    END

    SELECT Account,
           [Branch Number],
           [Transaction Type],
           Amount,
           [Transaction Date]
    FROM #WarrantyTransactions
    ORDER BY RowType


Go

