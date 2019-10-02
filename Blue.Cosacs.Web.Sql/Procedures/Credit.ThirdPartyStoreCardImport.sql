IF OBJECT_ID('Credit.ThirdPartyStoreCardImport') IS NOT NULL
	DROP PROCEDURE Credit.ThirdPartyStoreCardImport
GO

CREATE PROCEDURE Credit.ThirdPartyStoreCardImport
AS
	SET NOCOUNT ON

--get payment method for store card payments
DECLARE @storeCardPaymentCode INT
SELECT @storeCardPaymentCode = code FROM code WHERE category = 'FPM' AND codedescript = 'StoreCard'

IF OBJECT_ID('tempdb..#tempFintrans') IS NOT NULL
DROP TABLE #tempFintrans

--get all data to be inserted in fintrans
SELECT 0 AS origbr,
        LEFT(sc.AcctNo, 3) AS branchNumber,
        sc.AcctNo AS accountNumber,
        ROW_NUMBER() OVER(PARTITION BY LEFT(sc.AcctNo, 3) ORDER BY LEFT(sc.AcctNo, 3) ) AS rowNumber,
        si.TransactionDate,
        CASE
            WHEN si.Amount > 0 THEN 'SCT'
            ELSE 'STR'
        END AS transactionTypeCode,
        -88888 AS empeeno,
        'N' AS transUpdated,
        'N' AS transPrinted,
        si.Amount AS TransactionValue,
        '' AS bankCode,
        '' AS bankAcctno,
        'SCImport' AS chequeNo,
        'SCI' AS ftnotes,
        CASE 
            WHEN si.Amount > 0 THEN @storeCardPaymentCode 
            ELSE 1
        END AS paymentMethod,
        0 AS RunNumber,
        'SCImport' AS source,
        si.CardNumber,
        ag.agrmtno
INTO #tempFintrans
FROM StoreCard sc
INNER JOIN Credit.StoreCardImport si
ON sc.CardNumber = si.CardNumber
INNER JOIN dbo.agreement ag 
ON sc.AcctNo = ag.acctno
WHERE si.Imported IS NULL


	INSERT INTO Fintrans
		(origbr,
         branchno,
         acctno,
         transrefno,
         datetrans,
         transtypecode,
         empeeno,
		transupdated,
        transprinted,
        transvalue,
        bankcode,
        bankacctno,
        chequeno,
		ftnotes,
        paymethod,
        runno,
        source,
        agrmtno)
	SELECT tf.origbr,
           tf.branchNumber,
           tf.accountNumber,
           tf.rowNumber + b.hirefno,
           tf.TransactionDate,
           tf.transactionTypeCode,
           tf.empeeno,
		   tf.transupdated,
           tf.transprinted,
           tf.TransactionValue,
           tf.bankcode,
           tf.bankacctno,
           tf.chequeno,
		   tf.ftnotes,
           tf.paymentMethod,
           tf.RunNumber,
           tf.source,
           tf.agrmtno	
	FROM #tempFintrans tf
    INNER JOIN branch b
    ON tf.branchNumber = b.branchno

    INSERT INTO finxfr
        (origbr,
         acctno,
         transrefno,
         datetrans,
         acctnoxfr,
         acctname,
         agrmtno,
         storecardno,
         OrigTransRefNo)
    SELECT tf.origbr,
           tf.accountNumber,
           tf.rowNumber + b.hirefno,
           tf.TransactionDate,
           'SCImport',
           'SCImport',
           tf.agrmtno,
           tf.CardNumber,
           0
    FROM #tempFintrans tf
    INNER JOIN branch b
    ON tf.branchNumber = b.branchno

    UPDATE b
    SET b.hirefno = b.hirefno + upd.rowNumber
    FROM branch b
    INNER JOIN
    (SELECT branchNumber, MAX(rowNumber) as rowNumber
     FROM #tempFintrans
     GROUP BY branchNumber
    ) AS upd
    ON b.branchno = upd.branchNumber

--Update account and customer details
	UPDATE acct
	SET outstbal =  (SELECT SUM(transvalue) FROM fintrans
	                 WHERE fintrans.acctno = acct.acctno)
	WHERE acctno IN (SELECT DISTINCT accountNumber FROM #tempFintrans)

	UPDATE c
    SET c.StoreCardAvailable = CASE 
                                   WHEN c.StoreCardLimit - ISNULL(a.transvalue, 0) > c.AvailableSpend THEN c.AvailableSpend
                                   WHEN c.StoreCardLimit - ISNULL(a.transvalue, 0) < 0 THEN 0
                                   ELSE c.StoreCardLimit - ISNULL(a.transvalue, 0)
                               END
    FROM customer c
    INNER JOIN (SELECT ca.custid, ISNULL(SUM(f.transvalue ),0) AS transvalue
                FROM fintrans f 
	            INNER JOIN custacct ca 
                   ON f.acctno = ca.acctno
	            INNER JOIN Acct a 
                   ON a.acctno= ca.acctno
                   AND a.accttype = 'T'
	            WHERE ca.custid IN (SELECT custId FROM custacct ca WHERE ca.acctno IN (SELECT DISTINCT accountNumber from #tempFintrans) AND ca.hldorjnt = 'H')
	            AND ca.hldorjnt = 'H'
                GROUP BY ca.custid
                ) AS a
        ON c.custid = a.custid

UPDATE Credit.StoreCardImport
SET Imported = 1
WHERE Imported IS NULL

DROP TABLE #tempFintrans

GO

