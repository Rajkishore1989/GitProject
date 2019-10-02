IF OBJECT_ID('Report.CustomerFeedbackHappyCall') IS NOT NULL
	DROP PROCEDURE Report.CustomerFeedbackHappyCall
GO 

CREATE PROCEDURE Report.CustomerFeedbackHappyCall
	@DateFrom		Date,
	@DateTo			Date,
	@Branch			Int = NULL,
	@StoreType		Char(1) = NULL,
	@Department		Int = NULL,
	@TechnicianId	Int = NULL,
	@PageIndex		int = 1,
	@PageSize       bigint = 250
AS
	SET NOCOUNT ON

	DECLARE @FirstRec int,
		@LastRec bigint

	IF ISNULL(@PageIndex, 0) < 1
		SET @PageIndex = 1

	IF ISNULL(@PageSize, 0) < 1
		SET @PageSize = 250

	SET @FirstRec = (@PageIndex - 1 ) * @PageSize
	SET @LastRec = ( @PageIndex * @PageSize + 1 )

	;WITH Results_CTE AS
	(
		SELECT 
			ROW_NUMBER() OVER (ORDER BY CONVERT(datetime, r.ResolutionDate) Desc) AS RowNo,
			Count(1) over () AS TotalCount,
			CONVERT(VarChar, r.ResolutionDate, 103) AS [Date Resolved],
			r.Id AS [Service Request Number],
			b.StoreType AS [Store Type],
			b.branchno AS [Store Location],
			r.Account AS [Account Number],
			r.ItemNumber AS [Product Code],
			r.Item AS [Product Description],
			r.ItemModelNumber AS [Model Number],
			r.ItemSerialNumber AS [Serial Number],
			CASE
				WHEN ISNULL(r.ReplacementIssued, 0) = 1 THEN r.ReasonForExchange
				ELSE ''
			END AS [Replacement Issued Reason],
			r.Resolution,
			ISNULL(r.CustomerTitle + ' ', '') +  ISNULL(r.CustomerFirstName + ' ', '') + ISNULL(r.CustomerLastName, '') AS [Customer Name],
			ISNULL(r.CustomerAddressLine1 + ' ', '') +  ISNULL(r.CustomerAddressLine2 + ' ', '') +  ISNULL(r.CustomerAddressLine3 + ' ', '') +  ISNULL(r.CustomerPostcode, '') AS [Customer Address],
			rc.MobilePhone AS [Customer Phone Number],
			r.WarrantyContractNo AS [Warranty Contract Number],
			w.Description AS [Warranty Description],
			u.FullName AS [Technician Name],
			r.IsClosed AS [Is Closed]
		FROM 
			Service.Request r
			INNER JOIN branch b
				ON r.Branch = b.branchno
			LEFT JOIN Warranty.Warranty w
				ON r.WarrantyNumber = w.Number
			LEFT JOIN Service.TechnicianBooking tb
				ON tb.RequestId = r.Id
				AND tb.Reject = 0
			LEFT JOIN Admin.[User] U
				ON tb.UserId = u.Id
			LEFT JOIN
			(
				SELECT x.RequestId, x.Value AS MobilePhone FROM service.RequestContact x WHERE type = 'MobilePhone'
			) As RC
				ON r.Id = rc.RequestId
		WHERE
			r.ResolutionDate BETWEEN @DateFrom AND @DateTo
			AND b.branchno = CASE
								WHEN @Branch IS NULL THEN b.branchno
								ELSE @Branch 
							 END
			AND b.StoreType = CASE 
								WHEN @StoreType IS NULL THEN b.StoreType
								ELSE @StoreType 
							  END
			AND ISNULL(r.ProductLevel_1, -1) = CASE 
													WHEN @Department IS NULL THEN ISNULL(r.ProductLevel_1, -1)
													ELSE @Department 
											   END
			AND ISNULL(tb.UserId, 0) = CASE 
											WHEN @TechnicianId IS NULL THEN ISNULL(tb.UserId, 0)
											ELSE @TechnicianId 
									   END
	)
	SELECT * 
	FROM Results_CTE
	WHERE RowNo > @FirstRec AND RowNo < @LastRec