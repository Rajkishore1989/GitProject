IF OBJECT_ID('Merchandising.BulkProductSave') IS NOT NULL
	DROP PROCEDURE Merchandising.BulkProductSave
GO 

CREATE PROCEDURE Merchandising.BulkProductSave		
AS
BEGIN


INSERT INTO Merchandising.Brand
(BrandCode, BrandName)
SELECT DISTINCT BrandCode, BrandName
FROM merchandising.productstaging s 
WHERE NOT EXISTS (SELECT 1 
				FROM Merchandising.Brand b
				WHERE b.BrandCode = s.BrandCode)
UPDATE p 
SET       p.sku = s.sku, 
          p.longdescription= s.longdescription, 
          p.producttype= s.producttype, 
          p.tags = s.tags,
		  p.storetypes= s.storetypes, 
          p.posdescription = p.posdescription,
		  p.[Attributes] = s.[Attributes], 
          p.lastupdateddate= s.lastupdateddate,
		  p.[Status]= s.[Status], 
          p.priceticket= s.priceticket, 
          p.skustatus= s.skustatus, 
          p.corporateupc= s.corporateupc, 
          p.vendorupc= s.vendorupc, 
          p.vendorstylelong= s.vendorstylelong, 
          p.countryoforigin= s.countryoforigin, 
          p.vendorwarranty= s.vendorwarranty, 
          p.replacingto= s.replacingto, 
          p.features= s.features, 
          p.brandid= b.id, 
          p.primaryvendorid= s.primaryvendorid, 
          p.laststatuschangedate= s.laststatuschangedate, 
          p.onlinedateadded= s.onlinedateadded, 
          p.labelrequired= s.labelrequired, 
          p.boxcount= s.boxcount, 
          p.productaction= s.productaction, 
          p.createdbyid= s.createdbyid,
           p.magentoexporttype = s.magentoexporttype
FROM       merchandising.product p 
INNER JOIN merchandising.productstaging s 
	ON s.sku = p.sku
INNER JOIN merchandising.Brand b 
	ON b.BrandCode = s.BrandCode

;WITH i 
AS
(
   SELECT ID, SKU, LongDescription, ProductType, Tags, StoreTypes, POSDescription, Attributes, CreatedDate, LastUpdatedDate, Status, PriceTicket, SKUStatus, CorporateUPC, 
              VendorUPC, VendorStyleLong, CountryOfOrigin, VendorWarranty, ReplacingTo, Features, BrandId, PrimaryVendorId, LastStatusChangeDate, OnlineDateAdded, LabelRequired, 
			  BoxCount, ProductAction, CreatedById, ExternalCreationDate, MagentoExportType, brandcode, ROW_NUMBER() OVER (PARTITION BY SKU ORDER BY ID DESC) as [row]
	FROM Merchandising.ProductStaging s
	WHERE NOT EXISTS (SELECT 1 
					  FROM Merchandising.Product p
					  WHERE p.SKU = s.SKU)
)
INSERT INTO Merchandising.Product
        ( SKU, LongDescription, ProductType, Tags, StoreTypes, POSDescription, Attributes, CreatedDate, LastUpdatedDate, Status, PriceTicket, SKUStatus, CorporateUPC, VendorUPC, VendorStyleLong, CountryOfOrigin, VendorWarranty, ReplacingTo, 
		Features,  PrimaryVendorId, LastStatusChangeDate, OnlineDateAdded, LabelRequired, BoxCount, ProductAction, CreatedById, ExternalCreationDate, MagentoExportType,BrandId)
	
SELECT SKU, LongDescription, ProductType, Tags, StoreTypes, POSDescription, Attributes, CreatedDate, LastUpdatedDate, Status, PriceTicket, 
	    SKUStatus, CorporateUPC, VendorUPC, VendorStyleLong, CountryOfOrigin, VendorWarranty, ReplacingTo, Features, PrimaryVendorId, LastStatusChangeDate, 
		OnlineDateAdded, LabelRequired, BoxCount, ProductAction, CreatedById, ExternalCreationDate, MagentoExportType, b.Id
FROM i
INNER JOIN merchandising.Brand b on b.BrandCode = i.BrandCode
WHERE [row] = 1


DECLARE @department int

SELECT @department = Id
FROM Merchandising.HierarchyLevel
WHERE Name = 'Department'

;WITH Stock
AS
(
	SELECT  crpv.ProductId id
	FROM Merchandising.CurrentRetailPriceView crpv
	INNER JOIN Merchandising.CostPrice cp ON cp.ProductId = crpv.ProductId
	INNER JOIN Merchandising.ProductHierarchy ph ON crpv.ProductId = ph.ProductId AND ph.HierarchyLevelId = @department
),
combo
AS
(
	SELECT cp.ComboProductId id
	FROM Merchandising.Combo c
	INNER JOIN Merchandising.ComboProductPrice cp on c.Id = cp.ComboProductId
	WHERE c.StartDate > GETDATE()
	AND GETDATE() < DATEADD(day,1,c.EndDate) 
),
[set]
AS
(
	SELECT sp.ProductId id
	FROM Merchandising.SetProduct sp
	INNER JOIN Merchandising.SetLocation l on l.SetId = sp.ProductId
	WHERE l.EffectiveDate > GETDATE()
)
UPDATE p
SET P.Status = CASE WHEN ISNULL(COALESCE(s.Id, c.id, st.id),0) = 0 THEN 1 ELSE 2 END,  -- Any promos, sets or products should be active? Set to active.
    p.LastStatusChangeDate  = CASE WHEN ISNULL(COALESCE(s.Id, c.id, st.id),0) != 0 THEN GETDATE() ELSE p.LastStatusChangeDate END
FROM Merchandising.Product p
LEFT JOIN Stock s on s.id = p.Id AND p.ProductType != 'Combo' AND p.ProductType != 'Set'
LEFT JOIN combo c on c.id = p.Id AND p.ProductType = 'Combo' 
LEFT JOIN [set] st on st.id = p.Id AND p.ProductType = 'Set' 
WHERE p.Status = 1  -- Only for new products. Leave existing ones at current state.
AND p.ProductType != 'RepossessedStock'

EXEC Merchandising.CreateNewProductStockLevels	

END

