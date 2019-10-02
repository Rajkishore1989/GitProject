if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_GetInvoiceAccountDetailsSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_GetInvoiceAccountDetailsSP]
GO


SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		<Author,,Name>
-- Create date: <Create Date,,>
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE  dbo.DN_GetInvoiceAccountDetailsSP --'78012180000035',0
	-- Add the parameters for the stored procedure here
	        @invoiceno VARCHAR(14)
			,@return int OUTPUT
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	SET  @return = 0   --initialise return code

    -- Insert statements for procedure here
	SELECT	
	Act.acctno	
	FROM  agreement Act 
	WHERE 	Act.AgreementInvoiceNumber = @invoiceno

  -- Return error If Error Found
 	IF (@@error != 0)
 	BEGIN
  		SET @return = @@error
 	END
END
GO
