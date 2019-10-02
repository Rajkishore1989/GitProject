IF EXISTS (SELECT * FROM sys.views WHERE name = 'ForceMerchandiseProductEnquiryIndexView')
DROP VIEW [Merchandising].[ForceMerchandiseProductEnquiryIndexView]
GO

CREATE VIEW [Merchandising].[ForceMerchandiseProductEnquiryIndexView]
AS
SELECT        ProductId AS Id, ProductId, SKU, LongDescription, POSDescription, ProductType, Tags, StoreTypes, PrimaryVendor, Suppliers, CreatedDate, Status, Hierarchy, LevelTags, Condition, StockAvailable, StockOnHand, StockOnOrder, 
                         StockAllocated, LabelRequired, CorporateUPC, VendorUPC, PreviousProductType
FROM            (SELECT        product.Id AS ProductId, product.SKU, product.LongDescription, product.POSDescription, product.ProductType, product.Tags, product.StoreTypes, product.LabelRequired, primaryVendor.Name AS PrimaryVendor, 
                                                    Vendor.Suppliers, product.CreatedDate, status.Name AS Status, h.Hierarchy, h.LevelTags, condition.Condition, SUM(Stock.StockAvailable) AS StockAvailable, SUM(Stock.StockOnHand) AS StockOnHand, 
                                                    SUM(Stock.StockOnOrder) AS StockOnOrder, SUM(Stock.StockAllocated) AS StockAllocated, product.CorporateUPC, product.VendorUPC, product.PreviousProductType
                          FROM            Merchandising.Product AS product INNER JOIN
                                                    Merchandising.ProductStatus AS status ON product.Status = status.Id LEFT OUTER JOIN
                                                    Merchandising.LocationStockLevelView AS Stock ON Stock.ProductId = product.Id AND Stock.VirtualWarehouse = 0 LEFT OUTER JOIN
                                                    Merchandising.ProductSupplierConcatView AS Vendor ON Vendor.ProductId = product.Id LEFT OUTER JOIN
                                                    Merchandising.RepossessedProductConditionView AS condition ON condition.ProductId = product.Id LEFT OUTER JOIN
                                                    Merchandising.ProductHierarchyConcatView AS h ON h.ProductId = product.Id LEFT OUTER JOIN
                                                    Merchandising.Supplier AS primaryVendor ON primaryVendor.Id = product.PrimaryVendorId
                          GROUP BY product.Id, product.SKU, product.LongDescription, product.ProductType, product.Tags, product.StoreTypes, primaryVendor.Name, Vendor.Suppliers, product.POSDescription, product.CreatedDate, status.Name, 
                                                    condition.Condition, h.Hierarchy, h.LevelTags, product.LabelRequired, product.CorporateUPC, product.VendorUPC, product.PreviousProductType) AS TEMP_TABLE

GO
