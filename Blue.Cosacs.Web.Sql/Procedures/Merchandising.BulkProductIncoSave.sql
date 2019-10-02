IF OBJECT_ID('Merchandising.BulkProductIncoSave') IS NOT NULL
	DROP PROCEDURE Merchandising.BulkProductIncoSave
GO 

CREATE PROCEDURE Merchandising.BulkProductIncoSave		
WITH EXECUTE AS OWNER
AS
BEGIN

DELETE FROM  [Merchandising].Incoterm 
WHERE EXISTS (SELECT 1 
              FROM merchandising.IncotermStaging s
			  WHERE s.ProductId = [Merchandising].Incoterm.productid)

INSERT INTO [Merchandising].Incoterm
(ProductId, Name, CurrencyType, SupplierUnitCost, CountryOfDispatch, LeadTime)
SELECT DISTINCT ProductId, Name, CurrencyType, SupplierUnitCost, CountryOfDispatch, LeadTime
FROM [Merchandising].IncotermStaging

END

