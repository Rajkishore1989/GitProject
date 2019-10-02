namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Messages.Merchandising.Products;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Hub.Client;

    using Product = Blue.Cosacs.Merchandising.Models.Product;

    public class ProductSubscriberController : Web.Controllers.HttpHubSubscriberController<ItemRecord>
    {
        private readonly IProductRepository productRepository;
        private readonly ISupplierRepository vendorRepository;
        private readonly IBrandRepository brandRepository;
        private readonly IRetailPriceRepository retailPriceRepository;
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public ProductSubscriberController(IProductRepository productRepository, ISupplierRepository vendorRepository, IBrandRepository brandRepository, IRetailPriceRepository retailPriceRepository, IMerchandisingHierarchyRepository hierarchyRepository, IStockSolrIndexer stockSolrIndexer)
        {
            if (retailPriceRepository == null)
            {
                throw new ArgumentNullException("retailPriceRepository");
            }
            this.productRepository = productRepository;
            this.vendorRepository = vendorRepository;
            this.brandRepository = brandRepository;
            this.retailPriceRepository = retailPriceRepository;
            this.hierarchyRepository = hierarchyRepository;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        protected override void Sink(int id, ItemRecord msg)
        {
            this.Validate(msg);

            using (var scope = Context.Write())
            {
                var product = this.SaveProduct(msg);

                this.UpdateIncoterms(product, msg);

                this.UpdateHierarchy(product,msg);

                this.stockSolrIndexer.Index(new[] { product.Id.Value });

                scope.Complete();
            }
        }

        private void UpdateHierarchy(Product product,ItemRecord msg)
        {
            var levels = this.hierarchyRepository.GetAllLevels();

            this.hierarchyRepository.Save(
                new Tag { Level = levels.Single(l => l.Name == "Class"), Name = msg.HierarchySection.HierarchyRec.ClassName },
                msg.HierarchySection.HierarchyRec.ClassCode);
            this.productRepository.SaveHierarchySetting(product.Id.Value, "Class", msg.HierarchySection.HierarchyRec.ClassName);

            this.hierarchyRepository.Save(
                new Tag { Level = levels.Single(l => l.Name == "Department"), Name = msg.HierarchySection.HierarchyRec.DepartmentName },
                msg.HierarchySection.HierarchyRec.DepartmentCode);
            this.productRepository.SaveHierarchySetting(product.Id.Value, "Department", msg.HierarchySection.HierarchyRec.DepartmentName);

            this.hierarchyRepository.Save(
                new Tag { Level = levels.Single(l => l.Name == "Division"), Name = msg.HierarchySection.HierarchyRec.DivisionName },
                msg.HierarchySection.HierarchyRec.DivisionCode);
            this.productRepository.SaveHierarchySetting(product.Id.Value, "Division", msg.HierarchySection.HierarchyRec.DivisionName);
        }

        private void UpdateIncoterms(Product product, ItemRecord msg)
        {
            var incoterms =
                msg.BasicCostSection.Select(
                    i =>
                    new Incoterm
                        {
                            CountryOfDispatch = i.CountryOfDispatch,
                            Name = i.IncotermName,
                            ProductId = product.Id.Value,
                            CurrencyType = i.CurrencyType,
                            LeadTime = i.LeadTime,
                            SupplierUnitCost = i.SupplierUnitCost
                        }).ToList();

            this.retailPriceRepository.SaveIncoterms(product.Id.Value, incoterms);
        }

        private Product SaveProduct(ItemRecord msg)
        {
            var product = this.productRepository.GetBySku(msg.SkuNumber) ?? new Product { SKU = msg.SkuNumber, Status = (int)ProductStatuses.NonActive };

            product.LongDescription = msg.LongDescription;
            product.POSDescription = msg.POSDescription.Replace(Convert.ToChar(160).ToString(), string.Empty);
            product.SKUStatus = msg.SKUStatusCode.ToUpper();
            product.CorporateUPC = msg.CorporateUPC;
            product.VendorUPC = msg.VendorUPC;
            product.VendorStyleLong = msg.VendorStyleLong;
            product.CountryOfOrigin = msg.CountryOfOrigin;
            product.VendorWarranty = msg.VendorWarranty;
            product.ReplacingTo = msg.ReplacingTo;
            product.CreatedDate = DateTime.Parse(msg.CreationDate).ToUniversalTime();
            product.ExternalCreationDate = DateTime.Parse(msg.CreationDate).ToUniversalTime();
            product.ProductAction = msg.CompanySection.CompanyRec.SkuAction;

            var vendor = this.vendorRepository.LocateResource(msg.VendorCode);
            product.PrimaryVendorId = vendor.Id;

            switch (msg.ProductType)
            {
                case "RegularStock":
                    product.ProductType = ProductTypes.RegularStock;
                    break;
                case "WithoutStock":
                    product.ProductType = ProductTypes.ProductWithoutStock;
                    break;
            }

            var brand = this.brandRepository.Save(new Brand { BrandCode = msg.BrandCode, BrandName = msg.BrandName });
            product.BrandId = brand.Id;

            product.Attributes =
                msg.AttributeSection.Where(a => !a.AttributeId.StartsWith("Feature_Benefit"))
                    .Select(a => new FieldSchema { Name = a.AttributeId, DisplayName = a.AttributeId, Value = a.AttributeValue })
                    .ToList();
            product.Features =
                msg.AttributeSection.Where(a => a.AttributeId.StartsWith("Feature_Benefit"))
                    .Select(a => new FieldSchema { Name = a.AttributeId, DisplayName = a.AttributeId, Value = a.AttributeValue })
                    .ToList();

            product = this.productRepository.Save(product, Request.RequestContext.HttpContext.GetUser().Id);

            return product;
        }

        private void Validate(ItemRecord msg)
        {
            using (var scope = Context.Read())
            {
                var errors = new List<string>();
                switch (msg.ProductType)
                {
                    case "RegularStock":
                    case "WithoutStock":
                        break;
                    default:
                        errors.Add(string.Format("Invalid product type ({0}) specified", msg.ProductType));
                        break;
                }

                var vendor = scope.Context.Supplier.FirstOrDefault(s => s.Code == msg.VendorCode);

                if (vendor == null)
                {
                    errors.Add(string.Format("A vendor with vendor code ({0}) does not exist", msg.VendorCode));
                }
                else
                {
                    var skuType = msg.CompanySection.CompanyRec.SKUType;
                    if (!string.Equals(skuType, vendor.Type, StringComparison.OrdinalIgnoreCase))
                    {
                        errors.Add(string.Format("The SKUType ({0} does not match the vendor type ({1})", skuType, vendor.Type));
                    }
                }

                var countryCode = new Blue.Config.Repositories.Settings().Get("ISOCountryCode");

                var msgCountryCode = msg.CompanySection.CompanyRec.Company.Split(new[] { "_" }, StringSplitOptions.RemoveEmptyEntries).First();
                if (!string.Equals(msgCountryCode, countryCode, StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add(string.Format("The country code ({0}) does not match the system country code ({1})", msgCountryCode, countryCode));
                }

                if (!string.IsNullOrWhiteSpace(msg.ReplacingTo) && !this.productRepository.SkuExists(msg.ReplacingTo))
                {
                    errors.Add(string.Format("The ReplacingTo SKU ({0}) does not exist", msg.ReplacingTo));
                }

                if (msg.VendorWarranty != null && (msg.VendorWarranty < 0 || msg.VendorWarranty > 99))
                {
                    errors.Add(string.Format("The vendor warranty period must be between 0-99 but the value is {0}.", msg.VendorWarranty));
                }

                if (errors.Any())
                {
                    throw new MessageValidationException(string.Join(Environment.NewLine, errors), null);
                }
            }
        }
    }
}