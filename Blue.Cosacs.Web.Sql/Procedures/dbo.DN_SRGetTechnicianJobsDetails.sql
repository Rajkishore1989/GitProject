/****** Object:  StoredProcedure [dbo].[DN_SRGetTechnicianJobsDetails]    Script Date: 04-12-2018 5.01.04 PM ******/
if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_SRGetTechnicianJobsDetails]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_SRGetTechnicianJobsDetails]
GO
/****** Object:  StoredProcedure [dbo].[DN_SRGetTechnicianJobsDetails]    Script Date: 04-12-2018 5.01.04 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Gurpreet.R.Gill
-- Create date: 29-Oct-2018
-- Description:	This procedure will get the jobs details
--				for the technician in case if the user
--				wants to override the current allocated jobs.
--				Tables Included Are - 
--				1.[Service].[TechnicianBooking] AS tb
--				2.[Service].[Request] AS r
--				3.[Warranty].[Warranty] AS ww
-- =============================================
CREATE PROCEDURE [dbo].[DN_SRGetTechnicianJobsDetails]
(
	@TechnicianId INT,
	@return INT OUTPUT
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
SELECT   
		CASE 
			WHEN r.Type IN ('SI') THEN 'Internal Customer'
			WHEN r.Type IN ('II') THEN 'Internal Installation'
			WHEN r.Type IN ('SE') THEN 'External Customer'
			WHEN r.Type IN ('IE') THEN 'External Installation'
			WHEN r.Type IN ('S') THEN  'Stock Repair'
			ELSE NULL
		END AS ServiceType,
	r.State AS CurrentJobState,
	r.Account AS AccountNumber,
	tb.RequestId AS ServiceRequestNo,
	CONVERT(date, r.CreatedOn) AS LoggedOn,
	CONVERT(date, r.ItemDeliveredOn) AS DeliveredOn,
		CASE
			WHEN r.WarrantyNumber LIKE '%M%' THEN 'MW'
			ELSE 'EW'
		END AS WarrantyType,
	CONCAT(r.ItemID,'-',r.Item) AS ItemCodeDescription,
	Convert(date,tb.Date) AS ServiceScheduledDate
FROM [Service].[TechnicianBooking] tb
LEFT JOIN [Service].[Request] r on tb.RequestId = r.Id
LEFT JOIN [Warranty].[Warranty] ww on r.WarrantyNumber = ww.Number
WHERE 
tb.UserId = @TechnicianId
AND 
r.State NOT IN ('Closed','Resolved')
AND 
r.ItemDeliveredOn IS NOT NULL

SET @return = @@error

END


GO


