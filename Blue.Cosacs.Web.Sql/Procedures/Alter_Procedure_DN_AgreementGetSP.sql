if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_AgreementGetSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_AgreementGetSP]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


-- =============================================
-- Author:		
-- Create date: 
-- Description:	
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
--15/12/18 added a column AgreementInvoiceNumber as a part of CR#
-- =============================================




CREATE PROCEDURE  [dbo].[DN_AgreementGetSP] --'780500000890','1245590',0
   			@acctNo VARCHAR(50),
   			@agrmtno int,
			@return int OUTPUT
 
AS
 
 	SET  @return = 0   --initialise return code
 
	SELECT	Act.DateAcctOpen AS "Account Opened", --IP - 04/02/10 - CR1072 - 3.1.9
			Act.paidpcent,
			Act.accttype as 'Account Type',	
			isnull(Act.termstype,'') as 'Terms Type',
			isnull(T.description, '') as 'Description',
			isnull( A.deposit, 0.00) as 'Deposit',
			isnull(Act.agrmttotal, 0.00) as 'Agreement Total',
			isnull(A.paymentmethod, '') as 'Payment Method',
			A.datedel  as 'Date Delivered',
			A.servicechg as 'Service Charge',
			A.dateagrmt as 'Agreement Date',
			isnull(A.codflag, '') as 'COD Flag',
			isnull(I.instalamount, 0.00) as 'Instalment Amount',
			I.datefirst as 'Date First Instalment',		
			I.datelast as 'Date Last Instalment',
			isnull(I.instalno, 0.00) as 'instalno',
			isnull(I.fininstalamt, 0.00)  as 'Final Instalment',
			convert(VARCHAR, I.dueday) as 'Day Due', 
			AC.code as 'Code',
			isnull(I.mthsintfree, 0.00)  as 'Months Interest Free',
			isnull(I.instaltot - A.deposit, 0.00)  as 'Instalment Total',
			isnull(Act.paidpcent, 0) as 'Percentage Paid',
            A.empeenoauth as 'DAed By EmpeeNo',					-- Bug #3257 
			isnull(u.FullName, '') as 'DAed By Employee Name',
			A.dateauth as 'Date DAed On',
			isnull(A.empeenochange, 0) as 'Last Changed By',
			isnull(UCb.FullName, '') as 'LstChanged By Employee Name',
			A.datechange as 'Date Last Changed',
			isnull(A.empeenosale, 0) as 'Sold By',
			isnull(uSb.FullName, '') as 'Sold By Employee Name',		
			Act.dateacctopen as 'Date Sold On',
			A.createdby,
			isnull(uCr.FullName,'') as 'createdbyname',
			A.paymentholidays,
			A.agrmtno,
			isnull(R.empeenoreverse, 0) as 'Reopened By',
			isnull(uRO.FullName, '') as 'Reopened By Employee Name',		
			R.datereversed as 'Date Reopened',
			A.AgreementInvoiceNumber as AgreementInvoiceNumber
			
	FROM		acct Act 
	LEFT JOIN	agreement A ON		Act.acctno = A.acctno AND		A.agrmtno = @agrmtno
	LEFT JOIN 	instalplan I	ON		A.acctno = I.acctno
	LEFT JOIN	acctcode AC	ON		AC.acctno = A.acctno    and AC.datedeleted is null
	LEFT JOIN	termstypetable T	ON		Act.termstype = T.termstype
	LEFT JOIN	Admin.[User] u 	ON	A.empeenoauth = u.id	
	LEFT JOIN	Admin.[User] uCb ON		A.empeenochange = uCb.id
	LEFT JOIN	Admin.[User] uSb ON		A.empeenosale = uSb.id
	LEFT JOIN	Admin.[User] uCr	ON		A.createdby = uCr.id
	LEFT JOIN 	reverse_cancellation R	ON		A.acctno = R.acctno
	LEFT JOIN 	Admin.[User] uRO	ON		R.empeenoreverse = uRo.id
	WHERE 	Act.acctno = @acctNo

 
 	IF (@@error != 0)
 	BEGIN
  		SET @return = @@error
 	END
	GO


	