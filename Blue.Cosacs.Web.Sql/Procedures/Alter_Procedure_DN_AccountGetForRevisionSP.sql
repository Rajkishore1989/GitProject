if exists (select * from dbo.sysobjects where id = object_id('[dbo].[DN_AccountGetForRevisionSP]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
DROP PROCEDURE [dbo].[DN_AccountGetForRevisionSP]
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
-- 13/12/18 added a column AgreementInvoiceNumber as a part of CR #
-- =============================================

CREATE PROCEDURE 	[dbo].[DN_AccountGetForRevisionSP] 
			@acctNo varchar(12),
			@agreementno int,
			@return int OUTPUT

AS
/*AA 02/06/04 65374 and PF.custid =P.custid performance change*/
/*	10/09/07 rdb CR906 have added a join to TermsType so we can access IsLoan field */
	SET 	@return = 0			--initialise return code
	declare @taxExempt int
	declare @dutyFree int
	declare @acctType char(1)
	declare @acctBlocked int
	declare @RFLimit money
	declare @RFAvail money
	declare @custid varchar(20)
	declare @paidAndTaken tinyint
	declare @stage1Complete int
	declare @currentBand varchar(4)
	declare @scoringBand varchar(4)
	declare @reference varchar(10)
    declare @isStaff bit
	declare @AgreementInvoiceNumber varchar(14)

	SET	@acctType = ''
	SET	@taxExempt = 0
	SET	@dutyFree = 0
	SET	@acctBlocked = 0
	SET	@RFLimit = 0
	SET	@RFAvail = 0
	SET	@paidAndTaken = 0
	SET	@stage1Complete = 1
	SET @reference = ''
    SET @isStaff = 0
	SET @AgreementInvoiceNumber = ''
	
	IF @agreementno > 1
	    SET @reference = CONVERT(varchar, @agreementno)

	IF EXISTS ( select 1 from acctcode 
	            where acctno = @acctNo and code = 'TE' and datedeleted is null and reference = @reference )
		SET @taxExempt = 1

	IF EXISTS ( select 1 from acctcode 
	            where acctno = @acctNo and code = 'DF' and datedeleted is null and reference = @reference )
		SET @dutyFree = 1	

	IF EXISTS (select 1 from acctcode where acctno = @acctNo and code = 'RFB' and datedeleted is null )
		SET @acctBlocked = 1	

	/* convert the account type to the display code */
	SELECT	@acctType = AT.accttype
	FROM		accttype AT, acct A
	WHERE	A.acctno = @acctNo
	AND		A.accttype = AT.genaccttype

	SELECT	@custid = custid
	FROM		custacct 
	WHERE	acctno = @acctNo
	AND		hldorjnt = 'H'

	IF(@acctType NOT IN ('C', 'S')) /* Acct Type Translation DSR 29/9/03 */
	BEGIN
		IF EXISTS	(SELECT 	1 
				FROM		proposalflag PF INNER JOIN proposal P
				ON		pf.acctno = p.acctno INNER JOIN custacct CA 
				ON		P.acctno = CA.acctno
				WHERE	CA.acctno = @acctNo
				AND		CA.hldorjnt = 'H' 
				AND		PF.checktype = 'S1'
				AND		isnull(PF.datecleared, '1/1/1900') = '1/1/1900' )
			SET	@stage1Complete = 0
	END
			

	IF(@custid = 'PAID & TAKEN')
		SET	@paidAndTaken = 1

	IF(@acctType = 'R')		--ready finance accounts
	BEGIN
		EXEC DN_CustomerGetRFLimitSP @custid, '', @RFLimit out, @RFAvail out, @return out
	END
	
	-- Scoring Band
	--EXEC DN_ScoringBandForAccountSP @AcctNo=@AcctNo, @CurrentBand=@CurrentBand OUT, 
	--@ScoringBand =@ScoringBand OUT, @Return =@return OUT

    SET @isStaff = isnull((SELECT 1
                    FROM acct a
                        INNER JOIN 
                            custacct ca on a.acctno = ca.acctno
                            and ca.hldorjnt = 'H'
                        INNER JOIN 
                            agreement ag on a.acctno = ag.acctno
                        LEFT JOIN 
                            custcatcode ccc on ccc.custid = ca.custid and ccc.code = 'STAF'
                        LEFT JOIN 
                            acctcode ac on ac.acctno = a.acctno and ac.code = 'STAF'
                        WHERE 
                            (a.currstatus = '9' OR (ccc.code = 'STAF' and ccc.datedeleted is null) OR (ac.code = 'STAF' and ac.datedeleted is null)
                                or exists(select * 
                                          from 
                                              acctcode ac1 inner join custacct ca1 on ac1.acctno = ca1.acctno
                                              and ca1.hldorjnt = 'H'
          and ca1.custid = ca.custid
                                              and ca1.acctno != ca.acctno
                                              and ac1.code = 'STAF'
                                              and ac1.datedeleted is null)
             or exists(select *
                                           from
                           acct a1 inner join custacct ca3 on a1.acctno = ca3.acctno
                                               and ca3.hldorjnt = 'H'
                                               and ca3.custid = ca.custid
                                               and a1.currstatus = '9')  
                             )
                        and a.acctno = @acctNo
                        and ag.agrmtno = @agreementno
                     ),0)

	
	SELECT	A.acctno,
			@acctType as accttype,
			@taxExempt as taxexempt,
			@dutyFree as dutyfree,
			A.dateacctopen,
			A.termstype,
			@CurrentBand AS CurrentBand,
			@ScoringBand AS ScoringBand,
			AG.empeenosale,
			ISNULL(AG.soa, '') AS soa, --IP - 09/04/10 - UAT 69 
			AG.paymethod,
			AG.servicechg,
			AG.agrmttotal,
			AG.deposit,
			AG.codflag,
			(AG.agrmttotal - AG.servicechg) as subtotal,
			isnull(I.instalno, 0) as instalno,
			isnull(I.instalamount, 0) as instalamount,
			isnull(I.fininstalamt, 0) as fininstalamt,
			@acctBlocked as RFBlock,
			isnull(C.FullName,'') as EmployeeName,
			@RFLimit as 'RFCreditLimit', 
			@RFAvail as 'RFAvailable', 
			CU.custid as 'CustomerID',
			AG.deliveryflag,
			@paidAndTaken as 'PaidAndTaken',
			isnull(A.outstbal, 0) as 'OutstBal',
			A.currstatus,
			@stage1Complete as 'Stage1Complete',
			AG.paymentholidays,
			isnull(I.datefirst, '1/1/1900') as datefirst,
			isnull(I.dueday, 0) as dueday,
			I.instantcredit,
			tt.isLoan,
			CU.scorecardtype,
			IsNull(I.InstalmentWaived, 0) as InstalmentWaived,
            @isStaff as IsStaff,
			----// CR2018-13-Raj-2018-12-05 Code For Getting AgreementInvoiceNumber From agreement table-----
			case AG.AgreementInvoiceNumber
			when 'NULL' then ' 0 ' 
			else 					
		     --STUFF(AG.AgreementInvoiceNumber,4,0,'-')
			 STUFF( CONCAT(AG.AgreementInvoiceNumber,(select '-' + FORMAT(CAST(max(InvoiceVersion) AS int),'00','en-US') from Invoicedetails where acctno = AG.acctno and agrmtno = AG.agrmtno)),4,0,'-') 
			 end  as AgreementInvoiceNumber
			 --AgreementInvoiceNumber
			--AG.AgreementInvoiceNumber
			-----------------------------------------------------------------------------------------
	FROM	acct A 
	INNER JOIN agreement AG ON A.acctno = AG.acctno 
	LEFT OUTER JOIN Admin.[User] C ON AG.empeenosale = C.id
	INNER JOIN custacct CA ON A.acctno = CA.acctno 
	INNER JOIN customer CU ON CA.custid = CU.custid 
	LEFT OUTER JOIN instalplan I ON A.acctno = I.acctno 
	LEFT OUTER JOIN termsTypeTable tt on a.TermsType = tt.termstype
	WHERE	A.acctno = @acctNo
	AND		AG.agrmtno = @agreementno
	AND		CA.hldorjnt = 'H'	
	IF (@@error != 0)
	BEGIN
		SET @return = @@error
	END
	
	
	GO
	