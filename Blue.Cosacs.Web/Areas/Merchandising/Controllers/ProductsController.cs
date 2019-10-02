using Blue.Config.Repositories;
using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Enums;
using Blue.Cosacs.Merchandising.Mappers;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Merchandising.Solr;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;
using Blue.Solr;
using Newtonsoft.Json;
using StructureMap;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Product = Blue.Cosacs.Merchandising.Models.Product;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class ProductsController : Controller
    {
        private readonly IProductRepository productRepository;
        private readonly ISupplierRepository supplierRepository;
        private readonly ILocationRepository locationRepository;
        private readonly IContainer container;
        private readonly ISettings settings;

        private readonly IRetailPriceRepository retailPriceRepository;

        private readonly ICostRepository costRepository;

        private readonly IProductMapper productMapper;

        private readonly IStockSolrIndexer stockSolrRepo;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public ProductsController(IProductRepository productRepo, ISupplierRepository supplierRepo, IContainer container, IRetailPriceRepository retailPriceRepository, ICostRepository costRepository, IProductMapper productMapper, ILocationRepository locationRepository, ISettings settings, IStockSolrIndexer stockSolrRepo, IStockSolrIndexer stockSolrIndexer)
        {
            this.productRepository = productRepo;
            this.supplierRepository = supplierRepo;
            this.container = container;
            this.retailPriceRepository = retailPriceRepository;
            this.costRepository = costRepository;
            this.productMapper = productMapper;
            this.locationRepository = locationRepository;
            this.settings = settings;
            this.stockSolrRepo = stockSolrRepo;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        public ActionResult Ref(string sku)
        {
            var product = this.productRepository.LocateResource(sku);
            if (product == null)
            {
                throw new HttpException((int)HttpStatusCode.NotFound, "Resource Not Found");
            }
            return RedirectToAction("Detail", product.ProductType, new { id = product.Id });
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Details(int id)
        {
            var productType = this.productRepository.GetProductType(id);
            return RedirectToAction("Detail", productType, new { id });
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Index(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        public string GetProducts(string q, int start = 0, int rows = 25, string query = "")
        {
            if (!string.IsNullOrEmpty(query))
            {
                query = query + " AND ";
            }
            else
            {
                query = "";
            }

            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
               query + " Type:MerchandiseStockSummary",
                facetFields: new string[] { "MerchandisingLevel_1", "MerchandisingLevel_2", "MerchandisingLevel_3" },
                showEmpty: false,
                start: start,
                rows: rows);

            return result;
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "MerchandiseStock")
        {
            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: new[] { "LocationName", "Fascia", "StoreTypes", "Warehouse", "ProductType", "ProductStatus", "Tags", "Vendors" },
                showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public void SelectSearch(string q, int rows = 25)
        {
            using (var scope = Context.Read())
            {
                var ProductType = scope.Context.Product.SingleOrDefault(p => q.Contains(p.SKU));


                if (!q.EndsWith("*"))
                {
                    q = q + "*";
                }
                if (string.IsNullOrEmpty(ProductType.PreviousProductType))
                {
                    if (ProductType.PreviousProductType== "RegularStock")
                    {
                        q = q + " AND PreviousProductType:RegularStock AND !ProductStatus:Deleted AND !ProductStatus:\"Non Active\"";

                    }
                    else
                    {

                        q = q + " AND ProductType:RegularStock AND !ProductStatus:Deleted AND !ProductStatus:\"Non Active\"";

                    }
                }

            }

            var solrQuery = new Blue.Solr.Query();
            var solrResult = solrQuery.SelectJson(q, "Type:MerchandiseStockSummary", facetFields: new string[] { }, rows: rows, showEmpty: false);
            Response.Write(solrResult);
        }

        [Permission(MerchandisingPermissionEnum.StockTransferEdit)]
        public JsonResult GetAvailability(int productId, int locationId)
        {
            return new JSendResult(JSendStatus.Success, productRepository.GetAvailability(productId, locationId));
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SearchStockProducts(string q, int? locationId)
        {
            if (!locationId.HasValue)
            {
                return new JSendResult(JSendStatus.BadRequest, "Location Required");
            }

            var results = productRepository.GetStockProducts(q, locationId.Value);
            return new JSendResult(JSendStatus.Success, results);
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SearchAllStockProducts(string q)
        {
            var results = productRepository.GetAllStockProducts(q);
            return new JSendResult(JSendStatus.Success, results);
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SearchStockProductsWithMatchingStoreType(string q, int? locationId, int? storeTypeLocationId)
        {
            if (!locationId.HasValue)
            {
                return new JSendResult(JSendStatus.BadRequest, "Location Required");
            }

            if (!storeTypeLocationId.HasValue)
            {
                return new JSendResult(JSendStatus.BadRequest, "Store Type Location Required");
            }

            var results = productRepository.GetStockProductsWithMatchingStoreType(q, locationId.Value, storeTypeLocationId.Value);
            return new JSendResult(JSendStatus.Success, results);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public JSendResult PurchaseProductSearch(string q, int? vendorId, int locationId, string type = "RegularStock", int rows = 25)
        {
            if (!q.EndsWith("*"))
            {
                q = q + "*";
            }
            var solrQuery = new Solr.Query();

            try
            {
                var filter =
                    string.Format(
                        "!ProductStatus:Deleted AND !ProductStatus:\"Non Active\" AND !ProductStatus:Discontinued AND !ProductStatus:Phased AND Type:MerchandiseStockSummary AND ProductType:"
                        + type);
                var solrResult = solrQuery.SelectAllRows(string.Format("{{\"query\":\"{0}\"}}", q), "ProductId,Sku,LongDescription,LabelRequired", filter);
                var deserialised = ((Result)new JsonSerializer().Deserialize(new StringReader(solrResult), typeof(Result))).Response.Docs;
                var validProductIds = deserialised.Select(p => int.Parse(p["ProductId"].ToString())).ToList();
                var productsuppliers = this.supplierRepository.GetSuppliers(validProductIds);

                if (productsuppliers.Any())
                {
                    validProductIds = validProductIds.Where(p => !productsuppliers.ContainsKey(p) || (!vendorId.HasValue || productsuppliers[p].Contains(vendorId.Value))).ToList();

                    var products = productRepository.GetStoreTypes(validProductIds);

                    var locationStoreType = locationRepository.Get(locationId).StoreType;
                    validProductIds = validProductIds.Where(p => (!products.ContainsKey(p) || !products[p].Any()) || products[p].Contains(locationStoreType)).ToList();

                    var costPrices = costRepository.GetCurrentByProducts(validProductIds);
                    var costPriceProductIds = costPrices.Select(cp => cp.ProductId).Distinct();
                    validProductIds = validProductIds.Where(costPriceProductIds.Contains).ToList();

                    var validProducts = deserialised.Where(d => validProductIds.Contains(int.Parse(d["ProductId"].ToString()))).ToList();
                    var stockLevels = productRepository.StockLevels(validProductIds, locationId);

                    foreach (var d in validProducts)
                    {
                        var productId = int.Parse(d["ProductId"].ToString());
                        var costPrice = costPrices.Where(cp => cp.ProductId == productId).OrderByDescending(p => p.LastLandedCostUpdated).First();
                        d["UnitCost"] = costPrice.SupplierCost;
                        d["UnitLandedCost"] = costPrice.LastLandedCost;
                        d["VendorCurrency"] = costPrice.SupplierCurrency;
                        var stockLevel = stockLevels.FirstOrDefault(cp => cp.ProductId == productId);
                        d["QuantityOnOrder"] = stockLevel == null ? 0 : stockLevel.StockOnOrder;
                    }

                    return new JSendResult(
                        JSendStatus.Success,
                        validProducts.Select(
                            d =>
                            new
                            {
                                Sku = d["Sku"].ToString(),
                                LongDescription = d["LongDescription"].ToString(),
                                ProductId = int.Parse(d["ProductId"].ToString()),
                                UnitCost = decimal.Parse(d["UnitCost"].ToString()),
                                UnitLandedCost = decimal.Parse(d["UnitLandedCost"].ToString()),
                                VendorCurrency = d["VendorCurrency"].ToString(),
                                QuantityOnOrder = d["QuantityOnOrder"].ToString(),
                                LabelRequired = bool.Parse(d["LabelRequired"].ToString())
                            }));
                }

                return new JSendResult(JSendStatus.Success);
            }
            catch (WebException ex)
            {
                // consume bad requests that are essentially bad solr queries
                if (ex.Status == WebExceptionStatus.ProtocolError)
                {
                    var response = ex.Response as HttpWebResponse;
                    if (response != null && response.StatusCode != HttpStatusCode.BadRequest)
                    {
                        throw;
                    }
                }
            }

            return new JSendResult(JSendStatus.Success);
        }

        [Permission(MerchandisingPermissionEnum.CostPriceView)]
        //[Permission(MerchandisingPermissionEnum.RetailPriceView)]
        public JSendResult PricingInfo(int productId, int? locationId, string fascia, DateTime effectiveDate)
        {
            var product = productRepository.Get(productId);

            var rp = retailPriceRepository.GetForProductLocationEffectiveDate(locationId, fascia, productId, effectiveDate);
            var cp = costRepository.GetByProduct(product.Id.Value).FirstOrDefault();

            if (rp == null)
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Product does not have a valid retail price at this location");
            }
            return new JSendResult(JSendStatus.Success, new { rp.RegularPrice, rp.CashPrice, rp.DutyFreePrice, AverageWeightedCost = cp == null ? 0 : cp.AverageWeightedCost, rp.TaxRate });
        }

        public JSendResult Get(int id)
        {
            var product = productRepository.Get(id);

            var model = product.ProductType != ProductTypes.RepossessedStock
                               ? productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser())
                               : productMapper.CreateRepossessedViewModel(product);

            return new JSendResult(JSendStatus.Success, model);
        }

        public JsonResult GetBySku(string sku)
        {
            return Json(this.productRepository.GetBySku(sku), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JSendResult StoreTypes(int id, List<string> storeTypes)
        {
            var product = productRepository.Get(id);
            this.ValidateProductTypePermissions(product);
            this.productRepository.SaveStoreTypes(id, storeTypes);

            if (product.Id != null)
            {
                var ids = new[] { Convert.ToInt32(product.Id) };
                ForceIndex(ids);
            }
            return new JSendResult(JSendStatus.Success);
        }

        [HttpPost]
        public JSendResult Tags(int id, List<string> productTags)
        {
            var product = productRepository.Get(id);
            if (product.Id != null)
            {
                ValidateProductTypePermissions(product);
                productRepository.SaveProductTags(id, productTags);
                var ids = new[] { Convert.ToInt32(product.Id) };
                ForceIndex(ids);
                return new JSendResult(JSendStatus.Success);
            }
            return new JSendResult(JSendStatus.BadRequest);
        }

        [HttpPost]
        public JSendResult HierarchySettings(int id, string level, string tag)
        {
            var product = productRepository.Get(id);
            this.ValidateProductTypePermissions(product);
            this.productRepository.SaveHierarchySetting(id, level, tag);
            if (product.Id.HasValue)
            {
                var ids = new[] { Convert.ToInt32(product.Id) };
                ForceIndex(ids);
                return new JSendResult(JSendStatus.Success);
            }

            return new JSendResult(
                JSendStatus.BadRequest,
                message: "Invalid Product SKU.");
        }

        [HttpPost]
        [ActionName("Vendors")]
        public JSendResult AddVendor(int id, int supplierId)
        {
            var product = productRepository.Get(id);
            this.ValidateProductTypePermissions(product);

            this.productRepository.AddSupplier(id, supplierId);

            if (product.Id != null)
            {
                var ids = new[] { Convert.ToInt32(product.Id) };
                ForceIndex(ids);
            }

            return new JSendResult(JSendStatus.Success);
        }

        [HttpDelete]
        [ActionName("Vendors")]
        public JSendResult RemoveVendor(int id, int supplierId)
        {
            var product = productRepository.Get(id);
            this.ValidateProductTypePermissions(product);
            this.productRepository.RemoveSupplier(id, supplierId);

            if (product.Id != null)
            {
                var ids = new[] { Convert.ToInt32(product.Id) };
                ForceIndex(ids);
            }

            return new JSendResult(JSendStatus.Success);
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult Vendors()
        {
            var showing = supplierRepository.Get().Where(s => s.Status == (int)SupplierStatusEnum.Active);
            return new JSendResult(JSendStatus.Success, showing.Select(s => new KeyValuePair<int, string>(s.Id, s.Name)));
        }

        [HttpPost]
        [Permission(MerchandisingPermissionEnum.AssociatedProductsEdit)]
        public JSendResult Associate(string sku, Dictionary<string, string> hierarchy)
        {
            var serialisedHierarchy = JsonConvert.SerializeObject(hierarchy);

            if (productRepository.ProductAssociationExists(sku, serialisedHierarchy))
            {
                return new JSendResult(JSendStatus.BadRequest, message: "An associated product record already exists for this product and hierarchy.");
            }

            var product = productRepository.AssociateProduct(sku, serialisedHierarchy);

            product.Hierarchy = hierarchy;

            return new JSendResult(JSendStatus.Success, product);
        }

        [HttpDelete]
        [Permission(MerchandisingPermissionEnum.AssociatedProductsEdit)]
        public JSendResult DeleteAssociation(int id)
        {
            productRepository.DeleteAssociation(id);
            return new JSendResult(JSendStatus.Success);
        }

        public JSendResult Create(Product product)
        {
            if (product.Id == null && product.ProductType == ProductTypes.SparePart)
            {
                product.SKU = GenerateSparePartSku();
            }

            if (productRepository.IsValidSku(product.Id, product.SKU))
            {
                this.ValidateProductTypePermissions(product);

                product = productRepository.Save(product, Request.RequestContext.HttpContext.GetUser().Id);
                var ids = new[] { Convert.ToInt32(product.Id) };

                ForceIndex(ids);

                var model = product.ProductType != ProductTypes.RepossessedStock
                                ? productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser())
                                : productMapper.CreateRepossessedViewModel(product);

                return new JSendResult(JSendStatus.Success, model);
            }

            return new JSendResult(
                JSendStatus.BadRequest,
                message: "Product SKU must be unique. Another product already exists with the same SKU.");
        }

        public JSendResult CovertProductTypeCodes(Product product)
        {
          
            if (product.ProductType != ProductTypes.ProductWithoutStock)
            {
                throw new InvalidOperationException();
            }
            foreach (var item in product.StockLevel)
            {
                if (item.StockOnHand>0 && item.StockAvailable>0)
                {
                    return new JSendResult(
                          JSendStatus.BadRequest,
                          message: "Product can not be convert for StockOnHand and Stock are availabe");
                }
            }
            if (productRepository.IsValidSku(product.Id, product.SKU))
            {
                this.ValidateProductTypePermissions(product);

                product = productRepository.Save(product, Request.RequestContext.HttpContext.GetUser().Id);

                var ids = new[] { Convert.ToInt32(product.Id) };

                ForceIndex(ids);

                var model = product.ProductType != ProductTypes.RepossessedStock
                                ? productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser())
                                : productMapper.CreateRepossessedViewModel(product);

                return new JSendResult(JSendStatus.Success, model);
            }

            return new JSendResult(
                JSendStatus.BadRequest,
                message: "Product SKU must be unique. Another product already exists with the same SKU.");
        }
        private string GenerateSparePartSku()
        {
            var country = settings.Get("countrycode").Trim();
            var id = HiLo.Cache("Merchandising.SparePart").NextId();
            if (id > 9999)
            {
                throw new OverflowException("No more Spare Part SKUs are available");
            }
            return string.Format("{0}{1}SP", country, id.ToString().PadLeft(4, '0'));
        }

        private void ValidateProductTypePermissions(Product product)
        {
            MerchandisingPermissionEnum permRequired;

            switch (product.ProductType)
            {
                case ProductTypes.RegularStock:
                    permRequired = MerchandisingPermissionEnum.RegularStockEdit;
                    break;
                case ProductTypes.ProductWithoutStock:
                    permRequired = MerchandisingPermissionEnum.ProductsWithoutStockEdit;
                    break;
                case ProductTypes.RepossessedStock:
                    permRequired = MerchandisingPermissionEnum.RepossessedStockEdit;
                    break;
                case ProductTypes.SparePart:
                    permRequired = MerchandisingPermissionEnum.SparePartsEdit;
                    break;
                case ProductTypes.Set:
                    permRequired = MerchandisingPermissionEnum.SetsEdit;
                    break;
                case ProductTypes.Combo:
                    permRequired = MerchandisingPermissionEnum.ComboEdit;
                    break;
                default:
                    throw new Exception("Invalid product type");
            }

            if (!this.HttpContext.GetUser().HasPermission(permRequired))
            {
                throw new Blue.Admin.PermissionException(this.container, permRequired);
            }
        }


        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] productIds = null)
        {
            this.stockSolrIndexer.Index(productIds);
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public ActionResult StatusUpdate(int id)
        {
            return new JSendResult(JSendStatus.Success, new { status = productRepository.GetStatusUpdate(id) });
        }

        [HttpGet]
        [CronJob]
        [LongRunningQueries]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        public void IndexProducts()
        {
            this.ForceIndex();
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.GetAllProductSKU)]
        public JSendResult Get()
        {
            return new JSendResult(JSendStatus.Success, productRepository.Get());
        }

        [HttpGet]
        public void SearchProducts(int branch, string q = "", int start = 0, int rows = 25)
        {
            var products = GetProductsJson(branch, q, start, rows);
            Response.Write(products);
        }

        private string GetProductsJson(int branch, string query, int start = 0, int rows = 25)
        {
            return new Solr.Query().SelectJsonWithJsonQuery(
                query,
                "Type:MerchandiseStockSummary",
                facetFields: new string[] { "MerchandisingLevel_1", "MerchandisingLevel_2", "MerchandisingLevel_3" },
                start: start,
                rows: rows,
                showEmpty: false);
        }
    }
}
