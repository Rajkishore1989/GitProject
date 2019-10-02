if exists (select * from dbo.sysobjects where id = object_id('[dbo].[TaxDetails]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[TaxDetails]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
/*-------------------------------------------------
   Author - Ashwini A
   Created on - 01 Oct 2018
   Use - Popule the Tax report for CURACAO 

-----------------------------------------------------*/

CREATE PROCEDURE [dbo].[TaxDetails] @taxtype varchar(10), @DateFrom datetime, @DateTo datetime, @Branch varchar(6)
AS
--Declare @taxtype varchar(10), @DateFrom datetime, @DateTo datetime, @Branch varchar(6)
--SET @taxtype = 'NonTaxable'
--SET @DateFrom = '9/10/2018'
--SET @DateTo = '9/17/2018'
--SET @Branch = '0'
BEGIN

declare @totalsales_lux money,
		@totalsalesorder_lux int,
		@totalsales_ob money,
		@totalsalesorder_ob int,
		@totalsales_del money,
		@totalsalesorder_del int,
		@normtaxamt_LUX money,
		@normtaxamt_OB money

select  d.*, p.id as ProductId ,taxamt
into #temp1
from delivery as d join merchandising.product as p
on d.itemno = p.sku 
join lineitem l 
on d.acctno = l.acctno and d.itemno = l.itemno
Where d.datedel BETWEEN @DateFrom and @DateTo
AND (d.stocklocn = @Branch OR @Branch = '0')

select t1.* , t.Name 
into #temp2
from #temp1 t1 inner join [Merchandising].[TaxRate] t 
on t.ProductId = t1.ProductId 
Where t1.datedel BETWEEN @DateFrom and @DateTo
AND (t1.stocklocn = @Branch OR @Branch = '0')

select  @totalsales_lux=sum(transvalue) from #temp2 where Name='LUX' and taxamt > 0
select  @totalsalesorder_lux=count(distinct acctno) from #temp2 where Name='LUX' and taxamt > 0

select @totalsales_del= (select sum(transvalue) from delivery d join lineitem l 
on d.acctno = l.acctno and d.itemno = l.itemno Where datedel BETWEEN @DateFrom and @DateTo AND (d.stocklocn = @Branch OR @Branch = '0') and l.taxamt > 0) 

select @totalsalesorder_del= (select count(distinct d.acctno) from delivery d join lineitem l 
on d.acctno = l.acctno and d.itemno = l.itemno Where datedel BETWEEN @DateFrom and @DateTo AND (d.stocklocn = @Branch OR @Branch = '0') and l.taxamt > 0) 

select @totalsales_ob = @totalsales_del - @totalsales_lux
select @totalsalesorder_ob = @totalsalesorder_del - @totalsalesorder_lux

select @normtaxamt_LUX=(select distinct(Rate) from [Merchandising].[TaxRate] where Name = 'LUX') * (select @totalsales_lux)
select @normtaxamt_OB=(select distinct(Rate) from [Merchandising].[TaxRate] where Name = 'OB') * (select @totalsales_Ob)



IF(@taxtype = 'LUX')
select DISTINCT t2.acctno,ag.AgreementInvoiceNumber,t2.datedel,t2.delorcoll,t2.itemno,t2.stocklocn,t2.quantity,t2.transvalue,l.taxamt * 100 as taxamt, 
@taxtype as name, 0 as TotalSalesOrder, @totalsales_lux as Totalsales_lux, 
@totalsalesorder_lux as Totalsalesorder_lux , @totalsales_del as Totalsales_del,
@totalsalesorder_del as Totalsalesorder_del, @totalsales_ob as Totalsales_ob,  
@totalsalesorder_ob as Totalsalesorder_ob, @normtaxamt_LUX as Normtaxamt_LUX,
@normtaxamt_OB as Normtaxamt_OB 
from #temp2 t2 join lineitem l 
on t2.acctno = l.acctno and t2.itemno = l.itemno
INNER JOIN Agreement ag on l.acctno = ag.acctno AND l.agrmtno =ag.agrmtno
Where t2.datedel BETWEEN @DateFrom and @DateTo
AND (t2.stocklocn = @Branch OR @Branch = '0')
and l.taxamt > 0 
ORDER BY t2.acctno,ag.AgreementInvoiceNumber

IF(@taxtype = 'OB')
select DISTINCT d.acctno,ag.AgreementInvoiceNumber,d.datedel,d.delorcoll,d.itemno,d.stocklocn,d.quantity,d.transvalue,l.taxamt * 100 as taxamt, @taxtype as name, 
0 as TotalSalesOrder, @totalsales_lux as Totalsales_lux, 
@totalsalesorder_lux as Totalsalesorder_lux , @totalsales_del as Totalsales_del,
@totalsalesorder_del as Totalsalesorder_del, @totalsales_ob as Totalsales_ob,  
@totalsalesorder_ob as Totalsalesorder_ob, @normtaxamt_LUX as Normtaxamt_LUX,
@normtaxamt_OB as Normtaxamt_OB from delivery d join lineitem l 
on d.acctno = l.acctno and d.itemno = l.itemno
INNER JOIN Agreement ag on l.acctno = ag.acctno AND l.agrmtno =ag.agrmtno

where d.acctno not in(select distinct(acctno) from #temp2)
and d.datedel BETWEEN @DateFrom and @DateTo
AND (d.stocklocn = @Branch OR @Branch = '0')
and l.taxamt > 0
ORDER BY d.acctno,ag.AgreementInvoiceNumber

IF(@taxtype = 'NonTaxable')
select DISTINCT t2.acctno,ag.AgreementInvoiceNumber,t2.datedel,t2.delorcoll,t2.itemno,t2.stocklocn,t2.quantity,t2.transvalue,l.taxamt * 100 as taxamt, 
@taxtype as name, 0 as TotalSalesOrder, @totalsales_lux as Totalsales_lux, 
@totalsalesorder_lux as Totalsalesorder_lux , @totalsales_del as Totalsales_del,
@totalsalesorder_del as Totalsalesorder_del, @totalsales_ob as Totalsales_ob,  
@totalsalesorder_ob as Totalsalesorder_ob, @normtaxamt_LUX as Normtaxamt_LUX,
@normtaxamt_OB as Normtaxamt_OB 
from #temp2 t2 join lineitem l 
on t2.acctno = l.acctno and t2.itemno = l.itemno
INNER JOIN Agreement ag on l.acctno = ag.acctno AND l.agrmtno =ag.agrmtno
Where t2.datedel BETWEEN @DateFrom and @DateTo
AND (t2.stocklocn = @Branch OR @Branch = '0')
and l.taxamt = 0
ORDER BY t2.acctno,ag.AgreementInvoiceNumber
Drop table #temp1
Drop table #temp2
END
GO

