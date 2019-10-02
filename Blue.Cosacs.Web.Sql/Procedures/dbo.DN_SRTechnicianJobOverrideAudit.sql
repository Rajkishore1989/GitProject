/****** Object:  StoredProcedure [dbo].[DN_SRTechnicianJobOverrideAudit]    Script Date: 04-12-2018 4.58.40 PM ******/
if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_SRTechnicianJobOverrideAudit]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_SRTechnicianJobOverrideAudit]
GO
/****** Object:  StoredProcedure [dbo].[DN_SRTechnicianJobOverrideAudit]    Script Date: 04-12-2018 4.58.40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Gurpreet.R.Gill
-- Create date: 30-Oct-2018
-- Description:	This procedure will insert the audit 
--				date when the user
--				overrides the current allocated jobs.
--				Tables Included Are - 
--				1.[SR_TechnicianJobOverrideAudit]
-- =============================================
CREATE PROCEDURE [dbo].[DN_SRTechnicianJobOverrideAudit]
(
	@OldRequestId INT,
    @OverrideByUserId INT,
    @OverideDate SMALLDATETIME,
    @NewRequestId INT,
	@return INT OUTPUT
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	INSERT INTO 
	[dbo].[SR_TechnicianJobOverrideAudit]
        (
			    OldRequestId
			   ,OverrideByUserId
			   ,OverideDate
			   ,NewRequestId
		)
     VALUES
		(
			   @OldRequestId,
			   @OverrideByUserId,
			   @OverideDate,
			   @NewRequestId
		)

SET @return = @@error

END



GO


