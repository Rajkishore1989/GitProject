IF OBJECT_ID('Service.RequestPartView') IS NOT NULL
	DROP VIEW Service.RequestPartView
GO

CREATE VIEW Service.RequestPartView 
AS
	SELECT 
		c.id,
		c.RequestId, 
		c.PartNumber, 
		c.PartType, 
		c.Quantity, 
		c.Description, 
		c.StockBranch, 
		c.Source, 
		c.CostPrice, 
		c.Price, 
		c.TaxAmount, 
		CONVERT(Decimal, COALESCE (c.TaxRate, s.taxrate, co.taxrate)) AS TaxRate,
		CASE 
			WHEN tax.TaxType = 'I' THEN s.CashPrice / (1 + (c.TaxRate / 100))
			ELSE s.CashPrice
		END AS CashPrice
	FROM 
		service.RequestPart c
		LEFT JOIN 
		(
			SELECT ISNULL(i.IUPC,i.itemno) as ItemNumber, q.stocklocn as Location, p.CashPrice, i.taxrate
			FROM StockInfo i INNER JOIN StockPrice p ON i.id = p.id INNER JOIN StockQuantity Q ON p.id= q.id AND p.branchno= q.stocklocn		
		) s
			ON c.PartNumber = s.ItemNumber
			AND c.StockBranch = s.Location 
		CROSS JOIN 
		(
			SELECT taxrate from country
		)co
		CROSS JOIN 
		(
			SELECT COALESCE(
				(SELECT c.ValueString FROM Config.Setting c WHERE c.Id = 'TaxType' AND c.Namespace = 'Blue.Cosacs.Sales'), 
				(SELECT Value FROM config.SettingView v WHERE v.CodeName = 'TaxType'),
				'E') as TaxType
		) tax

		