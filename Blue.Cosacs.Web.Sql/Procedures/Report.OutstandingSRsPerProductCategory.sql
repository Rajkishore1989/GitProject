IF OBJECT_ID('Report.OutstandingSRsPerProductCategory') IS NOT NULL
	DROP PROCEDURE Report.OutstandingSRsPerProductCategory 
GO 
CREATE PROCEDURE Report.OutstandingSRsPerProductCategory
		@DateFrom DATE,
		@DateTo DATE,
		@CurrentDate DATE,
		@Status varchar( 32 ),
		@Supplier varchar( 100 ) = NULL,
		@Technician int = NULL,
		@WarrantyType char( 1 ) = NULL
AS BEGIN
	SET NOCOUNT ON

	IF OBJECT_ID( 'tempdb..#ServiceData' )IS NOT NULL 
		DROP TABLE #ServiceData

	IF @Supplier = '' 
		SET @Supplier = NULL

	IF @WarrantyType = '' 
		SET @WarrantyType = NULL

	SELECT 
		sr.Id, 
		h.Name AS [ProductCategory], 
		CASE
			WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
				DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '0' AND 
				DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '3' THEN DATEDIFF( day, sr.CreatedOn, @currentDate )
			WHEN @Status IN( 'Allocated' ) AND 
				tb.AllocatedOn IS NOT NULL AND 
				DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '0' AND 
				DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '3' THEN DATEDIFF( day, tb.AllocatedOn, @currentDate )
		END AS 'col1', 
		CASE
			WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
				DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '4' AND 
				DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '7' THEN DATEDIFF( day, sr.CreatedOn, @currentDate )
			WHEN @Status IN( 'Allocated' ) AND 
				tb.AllocatedOn IS NOT NULL AND 
				DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '4' AND 
				DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '7' THEN DATEDIFF( day, tb.AllocatedOn, @currentDate )
		END AS 'col2', 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '8' AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '14' THEN DATEDIFF( day, sr.CreatedOn, @currentDate )
		WHEN @Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '8' AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '14' THEN DATEDIFF( day, tb.AllocatedOn, @currentDate )
		END AS 'col3', 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '15' THEN DATEDIFF( day, sr.CreatedOn, @currentDate )
		WHEN @Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '15' THEN DATEDIFF( day, tb.AllocatedOn, @currentDate )
		END AS 'col4', 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '0' AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '3' OR 
			@Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '0' AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '3' THEN CAST( sr.Id AS varchar )
			ELSE ''
		END AS [Requests 0-03], 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '4' AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '7' OR 
			@Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '4' AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '7' THEN CAST( sr.Id AS varchar )
			ELSE ''
		END AS [Requests 4-07], 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '8' AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) <= '14' OR 
			@Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '8' AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) <= '14' THEN CAST( sr.Id AS varchar )
			ELSE ''
		END AS [Requests 8-14], 
		CASE
		WHEN @Status IN( 'All Outstanding', 'Unallocated' ) AND 
			DATEDIFF( day, sr.CreatedOn, @currentDate ) >= '15' OR 
			@Status IN( 'Allocated' ) AND 
			tb.AllocatedOn IS NOT NULL AND 
			DATEDIFF( day, tb.AllocatedOn, @currentDate ) >= '15' THEN CAST( sr.Id AS varchar )
			ELSE ''
		END AS [Requests 15] 
	INTO #ServiceData
	FROM
		Service.Request sr 
		INNER JOIN Merchandising.HierarchyTag h
			ON sr.ProductLevel_2 = h.Id
			AND h.LevelId = 2
		LEFT JOIN Warranty.WarrantySale ws
			ON sr.Account = ws.CustomerAccount 
			AND ws.ItemId = sr.ItemId 
			AND ws.StockLocation = sr.ItemStockLocation 
			AND sr.CreatedOn >= ws.EffectiveDate 
			AND sr.CreatedOn <= DATEADD( month, ws.WarrantyLength, ws.EffectiveDate ) 
			AND ws.Status != 'Redeemed' 
			AND ws.id = 
			( 
				SELECT MAX( id )
				FROM Warranty.WarrantySale ws1
				WHERE 
					ws1.CustomerAccount = ws.CustomerAccount 
					AND ws1.AgreementNumber = ws.AgreementNumber 
					AND ws1.ItemId = ws.ItemId 
					AND ws1.StockLocation = ws.StockLocation 
					AND ws1.Status = ws.Status 
					AND sr.CreatedOn >= ws1.EffectiveDate 
					AND sr.CreatedOn <= DATEADD(month, ws1.WarrantyLength, ws1.EffectiveDate)
			)
		LEFT JOIN Service.TechnicianBooking tb
			ON sr.Id = tb.RequestId
		LEFT JOIN Admin.[User] u
			ON tb.UserId = u.Id
	WHERE 
		(
			(
				@Status IN( 'All Outstanding', 'Unallocated' ) 
				AND CAST( sr.CreatedOn AS date ) >= @DateFrom 
				AND CAST( sr.CreatedOn AS date ) <= @DateTo 
			) OR 
			(	
				@Status IN( 'Allocated' ) 
				AND CAST( tb.AllocatedOn AS date ) >= @DateFrom 
				AND CAST( tb.AllocatedOn AS date ) <= @DateTo
			)
		) 
		AND 
		(
			(
				@Status = 'All Outstanding' 
				AND sr.State IN( 'New', 'Awaiting Deposit', 'Awaiting Allocation', 'Awaiting Spare Parts', 'Awaiting Repair', 'Awaiting installation' ) 
			) OR 
			(
				@status = 'Unallocated' 
				AND sr.State IN( 'New', 'Awaiting Deposit', 'Awaiting Allocation' ) 
			) OR 
			(
				@Status = 'Allocated' 
				AND sr.State IN( 'Awaiting Spare Parts', 'Awaiting Repair', 'Awaiting installation' )
			)
		) 
		AND (@Supplier IS NULL OR sr.Manufacturer = @Supplier) 
		AND (@Technician IS NULL OR u.Id = @Technician) 
		AND (@WarrantyType IS NULL OR ws.WarrantyType = @WarrantyType)

	/*
		Band01: Outstanding with 0 to 3 days period
		Band02: Outstanding with 4 to 7 days period
		Band03: Outstanding with 8 to 14 days period
		Band04: Outstanding with more than 14 days period
	*/

	IF @Status = 'Allocated'
		BEGIN
			SELECT sd.[ProductCategory], 
				   COUNT( sd.col1 )AS 'DaysOutstandingBand01',
				   count( sd.col2 )AS 'DaysOutstandingBand02',
				   count( sd.col3 )AS 'DaysOutstandingBand03',
				   count( sd.col4 )AS 'DaysOutstandingBand04', 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 0-03], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 0-03]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand01], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 4-07], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 4-07]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand02], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 8-14], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 8-14]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand03], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 15], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 15]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS ServiceRequestsBand04
			  FROM #ServiceData sd
			  GROUP BY sd.[ProductCategory];
		END;
	ELSE
		BEGIN
			SELECT sd.[ProductCategory], 
				   COUNT( sd.col1 )AS 'DaysOutstandingBand01',
				   COUNT( sd.col2 )AS 'DaysOutstandingBand02',
				   COUNT( sd.col3 )AS 'DaysOutstandingBand03',
				   COUNT( sd.col4 )AS 'DaysOutstandingBand04', 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 0-03], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 0-03]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand01], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 4-07], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 4-07]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand02], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 8-14], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 8-14]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS [ServiceRequestsBand03], 
				   STUFF(( 
						   SELECT CASE
								  WHEN ISNULL( [Requests 15], '' ) = '' THEN ''
									  ELSE ', ' + [Requests 15]
								  END
							 FROM #ServiceData A
							 WHERE A.[ProductCategory] = sd.[ProductCategory]
							 FOR XML PATH( '' )), 1, 2, '' )AS ServiceRequestsBand04
			  FROM #ServiceData sd
			  GROUP BY sd.[ProductCategory]
			  HAVING COUNT( sd.col1 ) > 0 OR 
					 COUNT( sd.col2 ) > 0 OR 
					 COUNT( sd.col3 ) > 0 OR 
					 COUNT( sd.col4 ) > 0;
		END
		
	IF OBJECT_ID( 'tempdb..#ServiceData' )IS NOT NULL 
		DROP TABLE #ServiceData
END