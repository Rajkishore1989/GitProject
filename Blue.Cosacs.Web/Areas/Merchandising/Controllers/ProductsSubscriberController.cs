namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Messages.Merchandising.Products;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Hub.Client;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;
    using Model = Blue.Cosacs.Merchandising.Models;


    public class ProductsSubscriberController : Web.Controllers.HttpHubSubscriberController<ItemInfoSending>
    {
        private readonly IPublisher publisher;
        private readonly IProductRepository productRepository;
        private readonly IBrandRepository brandRepository;
        private readonly IMerchandisingHierarchyRepository merchandisingHierarchyRepository;
        private readonly IRetailPriceRepository retailPriceRepository;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public ProductsSubscriberController(IPublisher publisher,
            IProductRepository productRepository,
            IBrandRepository brandRepository,
            IMerchandisingHierarchyRepository merchandisingHierarchyRepository,
            IRetailPriceRepository retailPriceRepository,
            IStockSolrIndexer stockSolrIndexer)
        {
            this.publisher = publisher;
            this.productRepository = productRepository;
            this.brandRepository = brandRepository;
            this.merchandisingHierarchyRepository = merchandisingHierarchyRepository;
            this.retailPriceRepository = retailPriceRepository;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        protected override void Sink(int id, ItemInfoSending msg)
        {
            var count = msg.ItemRecord.Length;

            if (count != msg.SummarySection.TotalRecords)
            {
                var error = string.Format(
                    "The total number of products does not match number specified in the summary. Count is {0} and summary specifies {1}",
                    count,
                    msg.SummarySection.TotalRecords);
                throw new MessageValidationException(error, null);
            }

            var products = msg.ItemRecord.ToList();


            var indexIds = new List<int>();

            using (var scope = Context.Write())
            {
                scope.Context.TruncateProductStaging();
                var vendors = scope.Context.Supplier.ToDictionary(d => d.Code);
                try
                {
                    // Validate and reject.
                    var rejected = Validate(products, vendors);
                    rejected.ForEach(p =>
                    {
                        this.publisher.Publish<Context, ItemRecord>("Merchandising.Product", p);
                    });

                    // Filter rejected.
                    var rsku = rejected.Select(r => r.SkuNumber).ToList();
                    products = products.Where(p => !rsku.Contains(p.SkuNumber)).ToList();

                    var productIds = SaveProduct(products, vendors);
                    SaveHierarchy(products, productIds);
                    SaveIncoterm(products, productIds);

                    indexIds = productIds.Select(x => x.Value).ToList();
                }
                catch
                {
                    products.ForEach(p =>
                    {
                        this.publisher.Publish<Context, ItemRecord>("Merchandising.Product", p);
                    });
                }
                scope.Context.SaveChanges();
                //  stockSolrIndexer.Index(indexIds);
                scope.Complete();
            }
        }

        private Dictionary<string, int> SaveProduct(List<ItemRecord> products, Dictionary<string, Supplier> vendors)
        {
            const string NonAlphaNum = @"[^A-Za-z0-9_]+";
            var existingProducts = this.productRepository.GetBySku(products.Select(s => s.SkuNumber));
            //var brands = this.brandRepository.Save(
            //    products.GroupBy(g => g.BrandCode).Select(b => new Brand { BrandCode = b.Key.Trim(), BrandName = b.Max(c => c.BrandName.Trim()) })).ToDictionary(d => d.BrandCode
            //    );
            var validMagento = new List<string> { MagentoExportTypes.All, MagentoExportTypes.NotAvailable, MagentoExportTypes.Warehouse };

            Func<string, string> filter = (a) =>
                {
                    Regex.Replace(a, NonAlphaNum, string.Empty);
                    return a;
                };

            Func<ItemRecord, Model.Product, Model.Product> updateProduct = (newProduct, existingProduct) =>
                 {

                     if (existingProduct == null)
                     {
                         existingProduct = new Model.Product { SKU = newProduct.SkuNumber, Status = (int)ProductStatuses.NonActive };
                     }

                     existingProduct.User = HttpContext.GetUser().Id;
                     existingProduct.LongDescription = newProduct.LongDescription;
                     existingProduct.POSDescription = newProduct.POSDescription.Replace(Convert.ToChar(160).ToString(), string.Empty);
                     existingProduct.SKUStatus = newProduct.SKUStatusCode.ToUpper();
                     existingProduct.CorporateUPC = newProduct.CorporateUPC;
                     existingProduct.VendorUPC = newProduct.VendorUPC;
                     existingProduct.VendorStyleLong = newProduct.VendorStyleLong;
                     existingProduct.CountryOfOrigin = newProduct.CountryOfOrigin;
                     existingProduct.VendorWarranty = newProduct.VendorWarranty;
                     existingProduct.ReplacingTo = newProduct.ReplacingTo;
                     existingProduct.CreatedDate = DateTime.Now.ToUniversalTime();
                     existingProduct.ExternalCreationDate = DateTime.Parse(newProduct.CreationDate);
                     existingProduct.ProductAction = newProduct.CompanySection.CompanyRec.SkuAction;
                     existingProduct.PrimaryVendorId = vendors[newProduct.VendorCode].Id;
                     existingProduct.BrandCode = newProduct.BrandCode;
                     existingProduct.BrandName = newProduct.BrandName;
                     existingProduct.ProductType = newProduct.ProductType == "WithoutStock" ? ProductTypes.ProductWithoutStock : newProduct.ProductType;
                     existingProduct.Attributes = newProduct.AttributeSection.Where(a => !a.AttributeId.StartsWith("Feature_Benefit"))
                                                  .Select(a => new FieldSchema { Name = filter(a.AttributeId), DisplayName = a.AttributeId, Value = a.AttributeValue }).ToList();
                     existingProduct.Features = newProduct.AttributeSection.Where(a => a.AttributeId.StartsWith("Feature_Benefit"))
                                                .Select(a => new FieldSchema { Name = filter(a.AttributeId), DisplayName = a.AttributeId, Value = a.AttributeValue })
                                                .ToList();
                     existingProduct.OnlineDateAdded = validMagento.Contains(existingProduct.MagentoExportType) &&
                                                       (existingProduct.MagentoExportType == MagentoExportTypes.All || existingProduct.MagentoExportType == MagentoExportTypes.Warehouse) ? DateTime.UtcNow : (DateTime?)null;

                     if (existingProduct.OnlineDateAdded.HasValue)
                     {
                         existingProduct.MagentoExportType = MagentoExportTypes.NotAvailable;
                     }
                     return existingProduct;
                 };

            var updatedProducts = products.Select(p =>
            {
                return updateProduct(p, existingProducts.Where(e => e.SKU == p.SkuNumber).FirstOrDefault());
            });
            return productRepository.Save(updatedProducts.ToList());
        }

        private void SaveHierarchy(List<ItemRecord> products, Dictionary<string, int> productId)
        {

            var tags = new List<Model.HierarchyTagImport>();
            products.ForEach(p =>
            {
                tags.Add(new Model.HierarchyTagImport
                {
                    Name = p.HierarchySection.HierarchyRec.ClassName,
                    Code = p.HierarchySection.HierarchyRec.ClassCode,
                    Level = "Class",
                    ProductId = productId[p.SkuNumber]

                });
                tags.Add(new Model.HierarchyTagImport
                {
                    Name = p.HierarchySection.HierarchyRec.DivisionName,
                    Code = p.HierarchySection.HierarchyRec.DivisionCode,
                    Level = "Division",
                    ProductId = productId[p.SkuNumber]

                });
                tags.Add(new Model.HierarchyTagImport
                {
                    Name = p.HierarchySection.HierarchyRec.DepartmentName,
                    Code = p.HierarchySection.HierarchyRec.DepartmentCode,
                    Level = "Department",
                    ProductId = productId[p.SkuNumber]
                });
            });
            merchandisingHierarchyRepository.Save(tags);
        }

        private void SaveIncoterm(List<ItemRecord> products, Dictionary<string, int> productId)
        {
            retailPriceRepository.SaveIncoterms(
            products.SelectMany(s => s.BasicCostSection.Select(
                                 i =>
                               new IncotermStaging
                               {
                                   CountryOfDispatch = i.CountryOfDispatch,
                                   Name = i.IncotermName,
                                   ProductId = productId[s.SkuNumber],
                                   CurrencyType = i.CurrencyType,
                                   LeadTime = i.LeadTime,
                                   SupplierUnitCost = i.SupplierUnitCost
                               })).ToList());
        }

        private List<ItemRecord> Validate(List<ItemRecord> products, Dictionary<string, Supplier> vendors)
        {
            using (var scope = Context.Read())
            {

                var skus = scope.Context.Product.Select(s => s.SKU).ToList();
                var countryCode = new Blue.Config.Repositories.Settings().Get("ISOCountryCode");

                return products.Where(p =>
                    !(p.ProductType != "RegularStock" || p.ProductType != "WithoutStock") ||
                    (!vendors.ContainsKey(p.VendorCode) || !string.Equals(p.CompanySection.CompanyRec.SKUType, vendors[p.VendorCode].Type, StringComparison.OrdinalIgnoreCase)) ||
                    !string.Equals(p.CompanySection.CompanyRec.Company.Split(new[] { "_" }, StringSplitOptions.RemoveEmptyEntries).First(), countryCode, StringComparison.OrdinalIgnoreCase) ||
                    !string.IsNullOrWhiteSpace(p.ReplacingTo) && !skus.Any(x => x == p.ReplacingTo) ||
                    (p.VendorWarranty != null && (p.VendorWarranty < 0 || p.VendorWarranty > 99))
                    ).ToList();
            }
        }
    }
}