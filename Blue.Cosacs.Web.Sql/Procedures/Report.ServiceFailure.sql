IF  EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('[Report].[ServiceFailure]') AND OBJECTPROPERTY(id,'IsProcedure') = 1)
DROP PROCEDURE [Report].[ServiceFailure]
GO

CREATE PROCEDURE [Report].[ServiceFailure]  
	@Year int,
	@QtrFrom int,
	@QtrTo	int,
	@Category varchar(200) = NULL,
	@Branch int = NULL,	
	@FailureRate decimal = 0
AS
	SET NOCOUNT ON

	declare @DateFrom date,
			@DateTo date
  
	select @DateFrom = min(startDate) from financialweeks where FinYear=@Year and Quarter=@QtrFrom
	select @DateTo = max(endDate)     from financialweeks where FinYear=@Year and Quarter=@QtrTo
	
	IF LTRIM(RTRIM(@Category)) = ''
		SET @Category = NULL

	SELECT DISTINCT 
		isnull(p.SKU,'') AS ProductCode, 
		isnull(p.LongDescription,'') AS CourtsCode,
		D.AcctNo AS AccountNumber,	
		D.quantity AS TotalSold, 
		D.datedel, 
		D.stocklocn, 
		D.agrmtno, 
		D.ItemID,
		t.Name AS categorydesc
	INTO #FailureRate
	FROM 
		Delivery D 			
		INNER JOIN Merchandising.Product p
			ON d.itemno = p.SKU
		LEFT JOIN Merchandising.ProductHierarchy ph
			ON p.Id = ph.ProductId
			AND ph.HierarchyLevelId = 2
		LEFT JOIN Merchandising.HierarchyTag t
			ON ph.HierarchyTagId = t.Id
	WHERE  
		EXISTS
		(					--Only need to show items for which there is a service request
			SELECT 1 
			FROM 
				Service.Request S 
				inner join service.resolution r on s.Resolution=r.[Description] and r.Fail=1
			WHERE
				IsClosed=1 -- only pick up closed sr's 				
				and s.ItemID = D.ItemID																													 
				and s.Type = 'SI'  --Courts accounts only
				AND (@DateFrom is null or ItemDeliveredOn  >= @DateFrom) 
				and (@DateTo is null or ItemDeliveredOn < @DateTo)
				and (@branch is null or left(d.acctno,3)=Cast(@Branch as char(3)))
		)
		AND (@DateFrom is null or D.DateDel  >= @DateFrom) 
		AND (@DateTo is null or D.DateDel < @DateTo)
		and d.quantity > 0
		and 
		(
			@Category is null or (@Category IS NOT NULL AND CAST(ph.HierarchyTagId as VARCHAR(3)) in(select items from splitFN(@Category, ',')))
		)

	;with fails
	as 
	(
		select 
			isnull(si.iupc,'') as productcode,
			ItemID,
			COUNT(*) as Numfail
		from 
			Service.Request s 
			INNER JOIN StockInfo si ON s.ItemID = si.ID
			inner join service.resolution r on s.Resolution=r.[Description] and r.Fail=1																											
		where 
			IsClosed=1  -- only pick up closed sr's 				
			and s.Type = 'SI' --Courts accounts only
			AND (@DateFrom is null or ItemDeliveredOn  >= @DateFrom) 
			and (@DateTo is null or ItemDeliveredOn < @DateTo)				
			and (@branch is null or left(s.Account,3)=@Branch)
		group by 
			si.iupc, ItemID
	),
	sold as		-- get total sold
	(
		select productcode, ItemID, SUM(f.TotalSold) as TotalSold																								
		from #FailureRate f	
		group by productcode, ItemID
	)
	select distinct	
		f.CategoryDesc as [Product Category],
		f.ProductCode as [Product Code],	
		y.TotalSold as [Total Sold],		
		MAX(s.itemdescr1+' '+s.itemdescr2 )as [Product Description],		
		MAX(NumFail) as [Total Number Failed],
		Round(MAX(NumFail) / y.TotalSold * 100.00,2) as [Failure Rate %]
	from 
		#FailureRate f 
		LEFT OUTER JOIN Service.Request r 
			on f.ItemID=r.ItemID and f.stocklocn=r.Itemstocklocation																								
			and f.AccountNumber=r.Account	
		INNER JOIN fails x ON x.ItemID = f.ItemID
		INNER JOIN sold y ON y.ItemID = f.ItemID
		INNER JOIN dbo.stockitem s on f.ItemID=s.ID and s.stocklocn=f.stocklocn
	group by 
		f.CategoryDesc,f.ProductCode, f.CourtsCode, s.prodstatus,y.TotalSold
	having  
		MAX(NumFail) / y.TotalSold  * 100.00 >= @FailureRate	 																									
	order by 
		f.CategoryDesc, f.ProductCode
go

