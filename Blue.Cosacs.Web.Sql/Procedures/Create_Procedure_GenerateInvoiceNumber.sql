if exists (select * from dbo.sysobjects where id = object_id('[dbo].[GenerateInvoiceNumber]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[GenerateInvoiceNumber] 
GO
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

--CR 2018-13 :  Invoice CR
CREATE PROCEDURE [dbo].[GenerateInvoiceNumber] 
(
	-- Add the parameters for the function here
	@BranchNumber AS nvarchar(14),
	@InvoiceNumber nvarchar(14) OUTPUT,
	@return int output
)

AS
BEGIN

set @return = 0;
-- Declare the return variable here
DECLARE @SequenceNumber nvarchar(14)

-- Get Current SequenceNumber from Branch Table
SELECT @SequenceNumber = ISNULL(InvoiceSequenceNumber, 0) FROM branch WHERE branchno = @BranchNumber
----If Sequence Number > 9999999 Then reset it to 1------------------------------
set @SequenceNumber = @SequenceNumber + 1
If (@SequenceNumber > 9999999)
	BEGIN
		SET @SequenceNumber = 1;
	END

-- Create SequenceNumber as per <Branch ID><MMYY><Sequence Number (7 Digits)> format
SET @InvoiceNumber = @BranchNumber + CAST(FORMAT(MONTH(GETDATE()),'00','en-US') AS VARCHAR(10) ) + CAST(RIGHT(YEAR(GETDATE()), 2) AS VARCHAR(10) ) + RIGHT('000000'+ CONVERT(VARCHAR,@SequenceNumber),7)

--Update branch number sequence
 UPDATE branch
SET InvoiceSequenceNumber = @SequenceNumber WHERE branchno = @BranchNumber

-- Return the result of the function
--return  @InvoiceNumber
IF (@@error != 0)
BEGIN
	SET @return = @@error
END	

END
Go

 