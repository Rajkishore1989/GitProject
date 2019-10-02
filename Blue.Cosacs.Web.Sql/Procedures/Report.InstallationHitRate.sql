IF OBJECT_ID('Report.InstallationHitRate') IS NOT NULL
    DROP PROCEDURE Report.InstallationHitRate
GO

CREATE PROCEDURE Report.InstallationHitRate
	@DateFrom			Date,
	@DateTo				Date,
	@Branch				Int = NULL,
	@DepartmentId		Int = NULL,
	@ProductCategoryId	Int = NULL,
	@CSR				Int = NULL
AS
	SET NOCOUNT ON

    IF OBJECT_ID('tempdb..#Deliveries') IS NOT NULL
		DROP TABLE #Deliveries

	SELECT 
		d.ItemID AS itemId,
		ag.empeenosale AS SalesPerson,
		d.branchno AS Branch,
		CASE 
			WHEN CONVERT(DATE, d.datedel) BETWEEN  @DateFrom AND @DateTo THEN 1
			ELSE 0
		END AS ThisPeriodSale, --this gives all sales that are within the filters
		CASE 
			WHEN CONVERT(DATE, d.datedel) BETWEEN  CONVERT(DATE, CONVERT(VARCHAR(4), YEAR(@DateTo)) + '0101') AND @DateTo THEN 1
			ELSE 0
		END AS ThisYearSale, --from the beginning of the year till @dateTo
		CASE 
			WHEN CONVERT(DATE, d.datedel) BETWEEN  CONVERT(DATE, CONVERT(VARCHAR(4), YEAR(@DateTo) - 1) + '0101') AND DATEADD(YEAR, -1, @DateTo) THEN 1
			ELSE 0
		END AS LastYearSale, --from the beginnig of the previous year till (@DateTo - 1 year)
		d.ParentItemID AS ParentItemId,
		d.quantity AS Quantity
	INTO #Deliveries
	FROM 
		delivery d
		INNER JOIN agreement ag
			ON d.acctno = ag.acctno
			AND d.agrmtno = ag.agrmtno
	WHERE
		d.quantity > 0
		AND 
		(
			CONVERT(DATE, d.datedel) BETWEEN  @DateFrom AND @DateTo --period that the user ask for
			OR CONVERT(DATE, d.datedel) BETWEEN  CONVERT(DATE, CONVERT(VARCHAR(4), YEAR(@DateTo)) + '0101') AND @DateTo --from the beginnig of the year till @DateTo
			OR CONVERT(DATE, d.datedel) BETWEEN  CONVERT(DATE, CONVERT(VARCHAR(4), YEAR(@DateTo) - 1) + '0101') AND DATEADD(YEAR, -1, @DateTo) --from beginning of previous year till (@dateto - 1 year)
		)
		AND d.branchno = CASE		
							WHEN @Branch IS NULL THEN d.branchno
							ELSE @Branch
						    END
		AND ag.empeenosale = CASE
								WHEN @CSR IS NULL THEN ag.empeenosale
								ELSE @CSR 
							END

	--Get all sales and apply all possible filters
	;WITH Installations(ItemId, ProductGroup, Category, Class, SubClass) AS
	(
		SELECT 
			s.id,
			NULLIF(sa.ProductGroup, 'Any') AS ProductGroup,
			NULLIF(sa.Category, 0) AS Category,
			NULLIF(sa.Class, 'Any') AS Class,
			NULLIF(sa.SubClass , 'Any') AS SubClass
		FROM 
			StockInfoAssociated sa
			INNER JOIN StockInfo s
				ON s.Id = sa.AssocItemId
				AND s.category in (91, 93) -- 91 and 93 are COSACS installation categories (for all countries)
	),
	--Get Products that are installations
	--joining StockInfo with Installations we know what products can have installations attached
	ProductWithInstallation(id, ProductCategory) AS
	(
		SELECT DISTINCT
			s.Id,
			s.category AS ProductCategory
		FROM 
			StockInfo s
			INNER JOIN ProductHeirarchy PH
				ON CONVERT(VARCHAR(32), s.category) = ph.primaryCode 
				AND ph.catalogType = '02'
			INNER JOIN  Installations a
				ON PH.ParentCode = ISNULL(a.ProductGroup, PH.ParentCode)
				AND CONVERT(VARCHAR, s.category) = ISNULL(a.category, s.category)
				AND ISNULL(s.Class, '') = COALESCE(a.Class, s.class, '')
				AND ISNULL(s.SubClass, '') = COALESCE(a.SubClass, s.SubClass, '')
			INNER JOIN Code c
				ON c.code = s.category
				AND c.category IN ('PCE', 'PCF', 'PCO', 'PCW')
			INNER JOIN Merchandising.Product pro
				ON s.itemno = pro.SKU
			LEFT JOIN 
			(
				SELECT h.ProductId, h.HierarchyTagId
				FROM Merchandising.ProductHierarchy h 
				WHERE h.HierarchyLevelId = 1
			) Dep
				ON pro.id = Dep.ProductId
			LEFT JOIN 
			(
				SELECT h.ProductId, h.HierarchyTagId
				FROM Merchandising.ProductHierarchy h 
				WHERE h.HierarchyLevelId = 2
			) Cat
				ON pro.id = Cat.ProductId
		WHERE
			ISNULL(Dep.HierarchyTagId, -1) = CASE 
												WHEN @DepartmentId IS NULL THEN ISNULL(Dep.HierarchyTagId, -1)
												ELSE @DepartmentId 
											 END
			AND ISNULL(Cat.HierarchyTagId, -1) = CASE 
													WHEN @ProductCategoryId IS NULL THEN ISNULL(Cat.HierarchyTagId, -1)
													ELSE @ProductCategoryId 
												 END
	),
	--Get products with installations sold
	ProductWithInstallationSold( Branch, SalesPerson, ProductCategory, LastYearSale, ThisPeriodSale, ThisYearSale, SalesCount) AS
	(
		SELECT 
			d.Branch,
			d.SalesPerson,
			s.ProductCategory,
			d.LastYearSale,
			d.ThisPeriodSale,
			d.ThisYearSale,
			SUM(d.Quantity) AS SalesCount
		FROM 
			ProductWithInstallation s
			INNER JOIN #Deliveries d
				ON s.Id = d.ItemId
		WHERE
			ParentItemId = 0
		GROUP BY
			d.Branch, d.SalesPerson, s.ProductCategory, d.LastYearSale, d.ThisPeriodSale, d.ThisYearSale
	),
	--get installations sold
	InstallationSold(Branch, SalesPerson, ProductCategory, LastYearSale, ThisPeriodSale, ThisYearSale, InstallationCount) AS
	(
		SELECT 
			d.Branch,
			d.SalesPerson,
			s.category,
			d.LastYearSale,
			d.ThisPeriodSale,
			d.ThisYearSale,
			SUM(d.Quantity) InstallationCount
		FROM 
			(SELECT ItemId FROM Installations GROUP BY ItemId) AS inst
			INNER JOIN #Deliveries d
				ON inst.ItemId = d.ItemId
			INNER JOIN StockInfo s
				ON d.ParentItemId = s.Id
		GROUP BY
			d.Branch, d.SalesPerson, s.category, d.LastYearSale, d.ThisPeriodSale, d.ThisYearSale
	),
	--this is just to SUM the columns that I will need to calculate the hit rate
	TotalSales(Branch, ProductCategory, SalesPerson, [Sales Count], [Installations Count], [Year to Date Sales Count], [Year to Date Installations Count], [Previous Year to Date Sales Count], [Previous Year to Date Installations Count]) AS 
	(
		SELECT
			pis.Branch,
			pis.ProductCategory,
			pis.SalesPerson,
			SUM(CASE
					WHEN pis.ThisPeriodSale = 1 THEN pis.SalesCount
					ELSE 0
				END) AS [Sales Count],
			SUM(CASE
					WHEN pis.ThisPeriodSale = 1 THEN iss.InstallationCount
					ELSE 0
				END) AS [Installations Count],
		
			SUM(CASE
					WHEN pis.ThisYearSale = 1 THEN pis.SalesCount
					ELSE 0
				END) AS [Year to Date Sales Count],
			SUM(CASE
					WHEN pis.ThisYearSale = 1 THEN iss.InstallationCount
					ELSE 0
				END) AS [Year to Date Installations Count],
		
			SUM(CASE
					WHEN pis.LastYearSale = 1 THEN pis.SalesCount
					ELSE 0
				END) AS [Previous Year to Date Sales Count],
			SUM(CASE
					WHEN pis.LastYearSale = 1 THEN iss.InstallationCount
					ELSE 0
				END) AS [Previous Year to Date Installations Count]
		FROM 
			ProductWithInstallationSold pis
			LEFT JOIN InstallationSold iss
				ON pis.Branch = iss.Branch
				AND pis.ProductCategory = iss.ProductCategory
				AND pis.SalesPerson = iss.SalesPerson
				AND pis.LastYearSale = iss.LastYearSale
				AND pis.ThisYearSale = iss.ThisYearSale 
				AND pis.ThisPeriodSale = iss.ThisPeriodSale
		GROUP BY
			pis.Branch, pis.ProductCategory, pis.SalesPerson
	)
	SELECT
		Branch,
		c.codedescript AS [Product Category],
		u.fullname AS  [Sales Person],
		[Sales Count],
		ISNULL([Installations Count], 0) AS [Installations Count], 
		CONVERT(DECIMAL(10, 3), 
			CONVERT(DECIMAL(10, 3), ISNULL([Installations Count], 0)) 
			/                           --The NULLIF is to avoid divide by 0 exception
			ISNULL(CONVERT(DECIMAL(10, 3), NULLIF([Sales Count], 0)), 1) * 100.0
		) AS [Hit Rate],
		
		ISNULL([Year to Date Sales Count], 0) AS [Year to Date Sales Count], 
		ISNULL([Year to Date Installations Count], 0) AS [Year to Date Installations Count], 
		CONVERT(DECIMAL(10, 3), 
			CONVERT(DECIMAL(10, 3), ISNULL([Year to Date Installations Count], 0)) 
			/                           --The NULLIF is to avoid divide by 0 exception
			ISNULL(CONVERT(DECIMAL(10, 3), NULLIF([Year to Date Sales Count], 0)), 1) * 100.0
		) AS [Year to Date Hit Rate],
		ISNULL([Previous Year to Date Sales Count], 0) AS [Previous Year to Date Sales Count], 
		ISNULL([Previous Year to Date Installations Count], 0) AS [Previous Year to Date Installations Count],
		CONVERT(DECIMAL(10, 3), 
			CONVERT(DECIMAL(10, 3), ISNULL([Previous Year to Date Installations Count], 0)) 
			/                           --The NULLIF is to avoid divide by 0 exception
			ISNULL(CONVERT(DECIMAL(10, 3), NULLIF([Previous Year to Date Sales Count], 0)), 1) * 100.0
		) AS [Previous Year to Date Hit Rate],
		CONVERT(DECIMAL(10, 3), 
			CONVERT(DECIMAL(10, 3), ISNULL([Year to Date Installations Count], 0)) / ISNULL(CONVERT(DECIMAL(10, 3), NULLIF([Year to Date Sales Count], 0)), 1) * 100.0
			-
			CONVERT(DECIMAL(10, 3), ISNULL([Previous Year to Date Installations Count], 0)) / ISNULL(CONVERT(DECIMAL(10, 3), NULLIF([Previous Year to Date Sales Count], 0)), 1) * 100.0
		)AS [Hit Rate Variance]
	FROM 
		TotalSales
		INNER JOIN admin.[user] u
			ON u.id = SalesPerson
		INNER JOIN code c
			ON c.code = CONVERT(VARCHAR(32), TotalSales.ProductCategory)
			AND c.category IN ('PCE', 'PCF', 'PCO', 'PCW')
	ORDER BY
		Branch, SalesPerson, ProductCategory

	DROP TABLE #Deliveries