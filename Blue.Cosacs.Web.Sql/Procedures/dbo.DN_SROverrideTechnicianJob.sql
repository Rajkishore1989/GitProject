/****** Object:  StoredProcedure [dbo].[DN_SROverrideTechnicianJob]    Script Date: 04-12-2018 4.56.41 PM ******/
if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_SROverrideTechnicianJob]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_SROverrideTechnicianJob]
GO
/****** Object:  StoredProcedure [dbo].[DN_SROverrideTechnicianJob]    Script Date: 04-12-2018 4.56.41 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Gurpreet.R.Gill
-- Create date: 29-Oct-2018
-- Description:	This procedure will delete the jobs
--				for the technician in case when the user
--				overrides the current allocated jobs.
--				Tables Included Are - 
--				1.[Service].[TechnicianBooking]
-- =============================================
CREATE PROCEDURE [dbo].[DN_SROverrideTechnicianJob]
(
	@TechnicianId INT,
	@RequestId INT,
	@return INT OUTPUT
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	DELETE
	FROM [Service].[TechnicianBooking]  
	WHERE 
	 UserId = @TechnicianId AND 
	 RequestId = @RequestId

SET @return = @@error

END


GO


