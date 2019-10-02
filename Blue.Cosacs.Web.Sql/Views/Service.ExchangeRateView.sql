IF EXISTS ( SELECT * FROM sysobjects
			WHERE name = 'ExchangeRateView')
DROP VIEW  service.ExchangeRateView
GO

CREATE VIEW Service.ExchangeRateView
AS
SELECT
    c.codedescript AS CurrencyName,
    e.*
FROM ExchangeRate e
LEFT JOIN dbo.code c
    ON e.Currency = c.code
WHERE c.category = 'FPM' -- Fintrans Pay Method
    AND e.[Status] = 'C' -- Current up to date valid rate
