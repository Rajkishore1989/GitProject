IF OBJECT_ID('Report.DeliveryPerformanceSummary') IS NOT NULL
	DROP PROCEDURE Report.DeliveryPerformanceSummary
GO 
CREATE PROCEDURE Report.DeliveryPerformanceSummary
  @Pivot            VarChar(2), -- SB - Sales Branch, DB - Delivery Branch, - F = Fascia
  @DateType         Char(1), -- O - OrderedOn, D - DeliveryConfirmedDate
  @DeliveryType     Char(1), --A - All, D - Delivery, C - Collection, R - Redelivery
  @DateFrom	        Date,	 
  @DateTo           Date

AS  

    Create table #results
    (
        [Pivot]                     varchar(20),
        [Same day delivery]         int,
        [Same day delivery %]       decimal (12,2),
        [Same day delivery ($)]     decimal (12,2),
        [Same day delivery ($) %]   decimal (12,2),
        [1 day late]                int,
        [1 day late %]              decimal (12,2),
        [1 day late ($)]            decimal (12,2),
        [1 day late ($) %]          decimal (12,2),
        [2-7 days late]             int,
        [2-7 days late %]           decimal (12,2),
        [2-7 days ($) late]         decimal (12,2),
        [2-7 days ($) late %]       decimal (12,2),
        [8+ days late]              int,
        [8+ days late %]            decimal (12,2),
        [8+ days ($) late]          decimal (12,2),
        [8+ days ($) late %]        decimal (12,2),
        [Total Count]               int,
        [Total Count %]             decimal (12,2),
        [Total Count ($)]                 decimal (12,2),
        [Total Count ($) %]               decimal (12,2)
    )

     IF(@Pivot = 'DB') --Delivery Branch
     BEGIN
	      --Select Total Deliveries & Total Unit Price for Days Late < 0 (early delivery), 0, 1, 2-7, 8+
	      ;WITH DBEarly AS
	      (
	 		    select 
				    wb.DeliveryBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <= 0
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     )
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
				    group by wb.DeliveryBranch
		 
	      ),
	      DB1DaysLate AS
	      (
		     select 
				    wb.DeliveryBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) = 1
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     )
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.DeliveryBranch
	      ),
	      DB2to7DaysLate AS
	      (
		     select 
				    wb.DeliveryBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=2
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <=7
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.DeliveryBranch
	      ),
	      DB8PlusDaysLate AS
	      (
		     select 
				    wb.DeliveryBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=8
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.DeliveryBranch
	      ),
	      DBTotals AS
	      (
		     select 
				    wb.DeliveryBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.DeliveryBranch
	      )

	       insert into #results
	       select 
			    wb.DeliveryBranch,-- [Pivot],
			    isnull(dbe.TotDel,0),-- [Same day delivery] - Total Deliveries - early delivery,
			    case
				    when cast(dbt.TotDel as decimal (12,2)) = 0 then 0
				    else isnull(cast(((cast(dbe.TotDel as decimal (12,2)) / cast(dbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [Same day delivery %] - % of early deliveries against total 
			    end,
			    isnull(dbe.TotUnitPrice,0),-- [Same day delivery ($)] - Total Unit Price of items - early delivery,
			    case 
				    when cast(dbt.TotUnitPrice as decimal (12,2)) = 0 then 0
				    else isnull(cast((cast(dbe.TotUnitPrice as decimal (12,2)) / cast(dbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [Same day delivery ($) %], -- % of unit price of early deliveries against total 
			    end,
			    isnull(db1.TotDel,0),-- [1 day late],
			    case 
				    when cast(dbt.TotDel as decimal (12,2)) = 0 then 0
				    else isnull(cast(((cast(db1.TotDel as decimal (12,2)) / cast(dbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [1 day late %],
			    end,
			    isnull(db1.TotUnitPrice,0),-- [1 day late ($)],
			    case 
				    when cast(dbt.TotUnitPrice as decimal (12,2)) = 0 then 0
				    else isnull(cast((cast(db1.TotUnitPrice as decimal (12,2)) / cast(dbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [1 day late ($) %],	
			    end,
			    isnull(db27.TotDel,0),-- [2-7 days late],
			    case 
				    when cast(dbt.TotDel as decimal (12,2)) = 0 then 0
				    else isnull(cast(((cast(db27.TotDel as decimal (12,2)) / cast(dbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [2-7 days late %],
			    end,
			    isnull(db27.TotUnitPrice,0),-- [2-7 days ($) late],
			    case 
				    when cast(dbt.TotUnitPrice as decimal (12,2)) = 0 then 0
				    else isnull(cast((cast(db27.TotUnitPrice as decimal (12,2)) / cast(dbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [2-7 days ($) late %],
			    end,
			    isnull(db8.TotDel,0),-- [8+ days late],
			    case
				    when cast(dbt.TotDel as decimal (12,2)) = 0 then 0
				    else isnull(cast(((cast(db8.TotDel as decimal (12,2)) / cast(dbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [8+ days late %],
			    end,
			    isnull(db8.TotUnitPrice,0),-- [8+ days ($) late],
			    case 
				    when cast(dbt.TotUnitPrice as decimal (12,2)) = 0 then 0
				    else isnull(cast((cast(db8.TotUnitPrice as decimal (12,2)) / cast(dbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [8+ days ($) late %], 
			    end,
			    isnull(dbt.TotDel,0),-- [Total Count],
			    case										--[Total Count %]
				    when isnull(dbt.TotDel,0) = 0 then 0
					else (isnull(dbt.TotDel,0) / isnull(dbt.TotDel,0)) * 100
			    end, --[Total Count %],
			    isnull(dbt.TotUnitPrice,0),-- [Total Count ($)]
			    case										--[Total Count ($) %]		
				    when isnull(dbt.TotUnitPrice,0) = 0 then 0
					else (isnull(dbt.TotUnitPrice,0) / isnull(dbt.TotUnitPrice,0)) * 100
			    end

	      from 
			    Warehouse.Booking wb
			    left join 
				    DBEarly dbe on wb.DeliveryBranch = dbe.DeliveryBranch
			    left join 
				    DB1DaysLate db1 on wb.DeliveryBranch = db1.DeliveryBranch
			    left join 
				    DB2to7DaysLate db27 on wb.DeliveryBranch = db27.DeliveryBranch
			    left join 
				    DB8PlusDaysLate db8 on wb.DeliveryBranch = db8.DeliveryBranch
			    left join 
				    DBTotals dbt on wb.DeliveryBranch = dbt.DeliveryBranch
	       group by 
			    wb.DeliveryBranch, dbe.TotDel, dbe.TotUnitPrice, db1.TotDel, db1.TotUnitPrice, db27.TotDel, db27.TotUnitPrice, db8.TotDel, db8.TotUnitPrice, dbt.TotDel, dbt.TotUnitPrice  

     END
     ELSE IF (@Pivot = 'SB') -- Sales Branch
     BEGIN


	      --Select Total Deliveries & Total Unit Price for Days Late < 0 (early delivery), 0, 1, 2-7, 8+
	      ;WITH SBEarly AS
	      (
	 		    select 
				    isnull(wb.SalesBranch,0) as SalesBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <= 0
		
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     )
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
				    group by wb.SalesBranch
		 
	      ),
	      SB1DaysLate AS
	      (
		     select 
				    isnull(wb.SalesBranch,0) as SalesBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) = 1
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.SalesBranch
	      ),
	      SB2to7DaysLate AS
	      (
		     select 
				    isnull(wb.SalesBranch,0) as SalesBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=2
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <=7
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.SalesBranch
	      ),
	      SB8PlusDaysLate AS
	      (
		     select 
				    isnull(wb.SalesBranch,0) as SalesBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=8
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.SalesBranch
	      ),
	      SBTotals AS
	      (
		     select 
				    isnull(wb.SalesBranch,0) as SalesBranch, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.SalesBranch
	      )

	       insert into 
				    #results
	       select 
				    isnull(cast(wb.SalesBranch as varchar(20)), 'No Sales Branch'),-- [Pivot],
				    isnull(sbe.TotDel,0),-- [Same day delivery], - Total Deliveries - early delivery
				    case 
					    when cast(sbt.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(sbe.TotDel as decimal (12,2)) / cast(sbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [Same day delivery %] - % of early deliveries against total
				    end,
				    isnull(sbe.TotUnitPrice,0),-- [Same day delivery ($)] - Total Unit Price of items - early delivery,
				    case 
					    when cast(sbt.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(sbe.TotUnitPrice as decimal (12,2)) / cast(sbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [Same day delivery ($) %], -- % of unit price of early deliveries against total 
				    end,
				    isnull(sb1.TotDel,0),-- [1 day late],
				    case 
					    when cast(sbt.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(sb1.TotDel as decimal (12,2)) / cast(sbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [1 day late %],
				    end,
				    isnull(sb1.TotUnitPrice,0),-- [1 day late ($)],
				    case 
					    when cast(sbt.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(sb1.TotUnitPrice as decimal (12,2)) / cast(sbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [1 day late ($) %],	
				    end,
				    isnull(sb27.TotDel,0),-- [2-7 days late],
				    case 
					    when cast(sbt.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(sb27.TotDel as decimal (12,2)) / cast(sbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [2-7 days late %],
				    end,
				    isnull(sb27.TotUnitPrice,0),-- [2-7 days ($) late],
				    case 
					    when cast(sbt.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(sb27.TotUnitPrice as decimal (12,2)) / cast(sbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [2-7 days ($) late %],
				    end,
				    isnull(sb8.TotDel,0),-- [8+ days late],
				    case 
					    when cast(sbt.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(sb8.TotDel as decimal (12,2)) / cast(sbt.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [8+ days late %],
				    end,
				    isnull(sb8.TotUnitPrice,0),-- [8+ days ($) late],
				    case 
					    when cast(sbt.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(sb8.TotUnitPrice as decimal (12,2)) / cast(sbt.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [8+ days ($) late %], 
				    end,
				    isnull(sbt.TotDel,0),-- [Total Count],
				    case										--[Total Count %]
					    when isnull(sbt.TotDel,0) = 0 then 0
						else (isnull(sbt.TotDel,0) / isnull(sbt.TotDel,0)) * 100
				    end, --[Total Count %]
				    isnull(sbt.TotUnitPrice,0),-- [Total Count ($)]
				    case										--[Total Count ($) %]
					    when isnull(sbt.TotUnitPrice,0) = 0 then 0
					    else (isnull(sbt.TotUnitPrice,0) / isnull(sbt.TotUnitPrice,0)) * 100
				    end
		      from 
				  Warehouse.Booking wb
		          left join 
				        SBEarly sbe on isnull(wb.SalesBranch,0) = isnull(sbe.SalesBranch,0)
		          left join 
				        SB1DaysLate sb1 on isnull(wb.SalesBranch,0) = isnull(sb1.SalesBranch,0)
		          left join 
				        SB2to7DaysLate sb27 on isnull(wb.SalesBranch,0) = isnull(sb27.SalesBranch,0)
		          left join 
				        SB8PlusDaysLate sb8 on isnull(wb.SalesBranch,0) = isnull(sb8.SalesBranch,0)
		          left join 
				        SBTotals sbt on isnull(wb.SalesBranch,0) = isnull(sbt.SalesBranch,0)
		       group by 
				    isnull(cast(wb.SalesBranch as varchar(20)),'No Sales Branch'), sbe.TotDel, sbe.TotUnitPrice, sb1.TotDel, sb1.TotUnitPrice, sb27.TotDel, sb27.TotUnitPrice, sb8.TotDel, sb8.TotUnitPrice, sbt.TotDel, sbt.TotUnitPrice  

     END
     ELSE IF (@Pivot = 'F') -- Fascia
     BEGIN

	     --Select Total Deliveries & Total Unit Price for Days Late < 0 (early delivery), 0, 1, 2-7, 8+
	      ;WITH FEarly AS
	      (
	 		    select 
				    wb.Fascia, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <= 0
		
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     )
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
				    group by wb.Fascia
		 
	      ),
	      F1DaysLate AS
	      (
		     select 
				    wb.Fascia, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) = 1
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.Fascia
	      ),
	      F2to7DaysLate AS
	      (
		     select 
				    wb.Fascia, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=2
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) <=7
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.Fascia
	      ),
	      F8PlusDaysLate AS
	      (
		     select 
				    wb.Fascia, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and datediff(day, wb.DeliveryOrCollectiondate, wb.DeliveryConfirmedDate) >=8
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.Fascia
	      ),
	      FTotals AS
	      (
		     select 
				    wb.Fascia, sum(wb.CurrentQuantity) as TotDel, sum(wb.CurrentQuantity * wb.UnitPrice) as TotUnitPrice
			     from 
				    Warehouse.Booking wb
			     where 
				    wb.CurrentQuantity > 0
				    and wb.DeliveryConfirmedDate is not null
				    and (
						    @DateType = 'O' and cast(wb.OrderedOn as date) >= @DateFrom and cast(wb.OrderedOn as date) <= @DateTo
						    or
						    @DateType = 'D' and wb.DeliveryConfirmedDate >= @DateFrom and wb.DeliveryConfirmedDate <= @DateTo
					     ) 
				    and (wb.DeliveryOrCollection = @DeliveryType or @DeliveryType = 'A')
			    group by wb.Fascia
	      )

		    insert into
				    #results
	        select 
				    case 
                        when wb.Fascia = 'C' then 'Courts'
					    else 'Non-Courts'
				    end,-- [Pivot],
				    isnull(fe.TotDel,0),-- [Same day delivery], - Total Deliveries - early delivery
				    case 
					    when cast(ft.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(fe.TotDel as decimal (12,2)) / cast(ft.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [Same day delivery %] - % of early deliveries against total
				    end,
				    isnull(fe.TotUnitPrice,0),-- [Same day delivery ($)] - Total Unit Price of items - early delivery,
				    case 
					    when cast(ft.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(fe.TotUnitPrice as decimal (12,2)) / cast(ft.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [Same day delivery ($) %], -- % of unit price of early deliveries against total 
				    end,
				    isnull(f1.TotDel,0),-- [1 day late],
				    case
					    when cast(ft.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(f1.TotDel as decimal (12,2)) / cast(ft.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [1 day late %],
				    end,
				    isnull(f1.TotUnitPrice,0),-- [1 day late ($)],
				    case 
					    when cast(ft.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(f1.TotUnitPrice as decimal (12,2)) / cast(ft.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [1 day late ($) %],	
				    end,
				    isnull(f27.TotDel,0),-- [2-7 days late],
				    case 
					    when cast(ft.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(f27.TotDel as decimal (12,2)) / cast(ft.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [2-7 days late %],
				    end,
				    isnull(f27.TotUnitPrice,0),-- [2-7 days ($) late],
				    case 
					    when cast(ft.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(f27.TotUnitPrice as decimal (12,2)) / cast(ft.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [2-7 days ($) late %],
				    end,
				    isnull(f8.TotDel,0),-- [8+ days late],
				    case 
					    when cast(ft.TotDel as decimal (12,2)) = 0 then 0
					    else isnull(cast(((cast(f8.TotDel as decimal (12,2)) / cast(ft.TotDel as decimal (12,2))) * 100) as decimal (12,2)),0)-- [8+ days late %],
				    end,
				    isnull(f8.TotUnitPrice,0),-- [8+ days ($) late],
				    case 
					    when cast(ft.TotUnitPrice as decimal (12,2)) = 0 then 0
					    else isnull(cast((cast(f8.TotUnitPrice as decimal (12,2)) / cast(ft.TotUnitPrice as decimal (12,2))) * 100 as decimal (12,2)),0)-- [8+ days ($) late %], 
				    end,
				    isnull(ft.TotDel,0),-- [Total Count],
			        case										--[Total Count %]
					    when isnull(ft.TotDel, 0) = 0 then 0
					    else (isnull(ft.TotDel,0) / isnull(ft.TotDel, 0)) * 100
				    end, -- [Total Count %]
				    isnull(ft.TotUnitPrice,0),-- [Total Count ($)]
				    case										--[Total Count ($) %]
					    when isnull(ft.TotUnitPrice,0) = 0 then 0
						else (isnull(ft.TotUnitPrice,0) / isnull(ft.TotUnitPrice,0)) * 100
				    end
					
		      from 
				    Warehouse.Booking wb
		          left join 
				        FEarly fe on wb.Fascia = fe.Fascia
		          left join 
				        F1DaysLate f1 on wb.Fascia = f1.Fascia
		          left join 
				        F2to7DaysLate f27 on wb.Fascia = f27.Fascia
		          left join 
				        F8PlusDaysLate f8 on wb.Fascia = f8.Fascia
		          left join 
				        FTotals ft on wb.Fascia = ft.Fascia
		       group by 
				    wb.Fascia, fe.TotDel, fe.TotUnitPrice, f1.TotDel, f1.TotUnitPrice, f27.TotDel, f27.TotUnitPrice, f8.TotDel, f8.TotUnitPrice, ft.TotDel, ft.TotUnitPrice  

     END
	--Finally insert the total line
	insert into 
		#results
	select 'TOTAL',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

	update #results
	    set [Total Count] = (select sum([Total Count]) from #results where [pivot] != 'TOTAL'),
		    [Total Count ($)] = (select sum([Total Count ($)]) from #results where [pivot] != 'TOTAL')
	where 
		[Pivot] = 'TOTAL'


	update #results
	set [Total Count %] = case 
							when [Total Count] = 0 then 0
						    else ([Total Count] / [Total Count]) * 100
					      end 
	where 
		[Pivot] = 'TOTAL'

	update
		#results
	set 
		[Total Count ($) %] = case 
							when [Total Count ($)] = 0 then 0
						    else ([Total Count ($)] / [Total Count ($)]) * 100
						end 
	where 
		[Pivot] = 'TOTAL'

	update #results
	set 
		[Same day delivery] = (select sum([Same day delivery]) from #results where [pivot] != 'TOTAL'),
		[Same day delivery ($)] = (select sum([Same day delivery ($)]) from #results where [pivot] != 'TOTAL'),
		[1 day late] =  (select sum([1 day late]) from #results where [pivot] != 'TOTAL'),
		[1 day late ($)] =  (select sum([1 day late ($)] ) from #results where [pivot] != 'TOTAL'),
		[2-7 days late] =  (select sum([2-7 days late]) from #results where [pivot] != 'TOTAL'),
		[2-7 days ($) late] =  (select sum([2-7 days ($) late] ) from #results where [pivot] != 'TOTAL'),
		[8+ days late] =  (select sum([8+ days late]) from #results where [pivot] != 'TOTAL'),
		[8+ days ($) late] =  (select sum([8+ days ($) late] ) from #results where [pivot] != 'TOTAL')
	where 
		[Pivot] = 'TOTAL'
		
	update 
		#results
	set [Same day delivery %] = case 
							        when cast([Total Count] as decimal(12,2)) = 0  then 0
								    else 
                                    (
                                        select cast((cast([Same day delivery] as decimal(12,2)) / cast([Total Count] as decimal(12,2))) * 100 as decimal (12,2)) 
                                        from #results
										where [pivot] = 'TOTAL'
                                    )
						        end,
		[Same day delivery ($) %] = case 
										when cast([Total Count ($)] as decimal(12,2)) = 0 then 0
									    else 
                                        (
                                            select cast((cast([Same day delivery ($)] as decimal(12,2)) / cast([Total Count ($)] as decimal(12,2))) * 100 as decimal (12,2)) 
                                            from #results
											where [pivot] = 'TOTAL'
                                        )
									end,
		[1 day late %] = case
							when cast([Total Count] as decimal(12,2)) = 0 then 0
							else 
                            (
                                select cast((cast([1 day late] as decimal(12,2)) / cast([Total Count] as decimal(12,2))) * 100 as decimal (12,2)) 
                                from #results
							    where [pivot] = 'TOTAL'
                            )
						end,
		[1 day late ($) %] = case
							    when cast([Total Count ($)] as decimal(12,2)) = 0 then 0
								else 
                                (
                                    select cast((cast([1 day late ($)] as decimal(12,2)) / cast([Total Count ($)] as decimal(12,2))) * 100 as decimal (12,2)) 
                                    from #results
									where [pivot] = 'TOTAL'
                                )
						    end,
		[2-7 days late %] = case 
							    when cast([Total Count] as decimal(12,2)) = 0 then 0
								else 
                                (
                                    select cast((cast([2-7 days late] as decimal(12,2)) / cast([Total Count] as decimal(12,2))) * 100 as decimal (12,2)) 
                                    from #results
									where [pivot] = 'TOTAL'
                                )
						    end,
		[2-7 days ($) late %] = case 
								    when cast([Total Count ($)] as decimal(12,2)) = 0 then 0
									else 
                                    (
                                        select cast((cast([2-7 days ($) late] as decimal(12,2)) / cast([Total Count ($)] as decimal(12,2))) * 100 as decimal (12,2)) 
                                        from #results
										where [pivot] = 'TOTAL'
                                    )
								end,
		[8+ days late %] = case 
						        when  cast([Total Count] as decimal(12,2)) = 0 then 0
								else 
                                (
                                    select cast((cast([8+ days late] as decimal(12,2)) / cast([Total Count] as decimal(12,2))) * 100 as decimal (12,2)) 
                                    from #results
									where [pivot] = 'TOTAL'
                                )
						end,
		[8+ days ($) late %] = case 
								    when cast([Total Count ($)] as decimal(12,2)) = 0 then 0
									else 
                                    (
                                        select cast((cast([8+ days ($) late] as decimal(12,2)) / cast([Total Count ($)] as decimal(12,2))) * 100 as decimal (12,2)) 
                                        from #results
										where [pivot] = 'TOTAL'
                                    )
						        end
	where 
		[Pivot] = 'TOTAL'
		
	SELECT 
        [Pivot],
        [Same day delivery],
        [Same day delivery %],
        [Same day delivery ($)],
        [Same day delivery ($) %],
        [1 day late],
        [1 day late %],
        [1 day late ($)],
        [1 day late ($) %],
        [2-7 days late],
        [2-7 days late %],
        [2-7 days ($) late],
        [2-7 days ($) late %],
        [8+ days late],
        [8+ days late %],
        [8+ days ($) late],
        [8+ days ($) late %],
        [Total Count],
        [Total Count %],
        [Total Count ($)],
        [Total Count ($) %]             
    FROM 
        #results 
    ORDER BY 
        [Pivot] asc
GO
