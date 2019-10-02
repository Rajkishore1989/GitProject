if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_GetInvoiceDetails]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_GetInvoiceDetails]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		Suvidha
-- Create date: 
-- Description:	
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
--15/12/18 added a column InvoiceVersion as a part of CR#
-- =============================================

CREATE PROCEDURE  [dbo].[DN_GetInvoiceDetails]
   			@acctNo VARCHAR(15),
			@agrmtno VARCHAR(10),
			@AgreementInvoiceNumber Varchar(15),
   			@return int OUTPUT
 
AS
 
 	SET  @return = 0   --initialise return code
	--Suvidha Added CR 2018-13
	--Declare @agrmtno int
	Declare @saleOrderID  Varchar(10), @soldByID  Varchar(10), @soldByName  Varchar(50)
	Declare @createdByID  Varchar(10), @createdByName  Varchar(50)
	Declare @taxInvoicePrinted char(1)--@amount money, @payMethod Varchar(20), 
	Declare @createdOn  Datetime
	--set @amount = 0;

	if(@AgreementInvoiceNumber = '')
	Begin
		
		select 
		@soldByID = IsNull(A.empeenosale, 0), 
		@soldByName = IsNull(uSb.FullName, ''),
		@createdByID = IsNull(A.empeenochange, 0),
		@createdByName =  IsNull(uCb.FullName, ''), @taxInvoicePrinted = A.[TaxInvoicePrinted]
		, @AgreementInvoiceNumber = A.AgreementInvoiceNumber
		from Agreement A 
		LEFT JOIN	Admin.[User] u 	ON	A.empeenoauth = u.id	
		LEFT JOIN	Admin.[User] uCb ON	A.empeenochange = uCb.id
		LEFT JOIN	Admin.[User] uSb ON	A.empeenosale = uSb.id
		where acctno = @acctNo and agrmtno = @agrmtno

		--select @agrmtno = agrmtno from agreement where acctno = @acctNo
		select @saleOrderID = @agrmtno
		select @AgreementInvoiceNumber = ISNULL(@AgreementInvoiceNumber, '')-- return @AgreementInvoiceNumber as '' if does not exist
	End
	Else
	Begin
		select @saleOrderID = id, @createdOn = CreatedOn 
		from sales.[Order] where AgreementInvoiceNumber = @AgreementInvoiceNumber

		select 
		@soldByID = IsNull(A.empeenosale, 0), 
		@soldByName = IsNull(uSb.FullName, ''),
		@createdByID = IsNull(A.empeenochange, 0),
		@createdByName =  IsNull(uCb.FullName, ''), @taxInvoicePrinted = A.[TaxInvoicePrinted]
		from Agreement A 
		LEFT JOIN	Admin.[User] u 	ON	A.empeenoauth = u.id	
		LEFT JOIN	Admin.[User] uCb ON	A.empeenochange = uCb.id
		LEFT JOIN	Admin.[User] uSb ON	A.empeenosale = uSb.id
		where AgreementInvoiceNumber = @AgreementInvoiceNumber		

		--select @soldByName = FirstName + ' ' + LastName from [admin].[user]  where id = @soldByID
		--select @createdByName = FirstName + ' ' + LastName from [admin].[user]  where id  = @createdByID
	End	

	select @saleOrderID as 'saleOrderID'
	, @soldByID as 'soldByID', @soldByName as 'soldByName'
	, @createdByID as 'createdByID', @createdByName as 'createdByName', @createdOn as 'createdOn'
	, @taxInvoicePrinted as 'taxInvoicePrinted'
	, @AgreementInvoiceNumber as 'agreementInvoiceNumber'
 
 	IF (@@error != 0)
 	BEGIN
  		SET @return = @@error
 	END
	GO

 