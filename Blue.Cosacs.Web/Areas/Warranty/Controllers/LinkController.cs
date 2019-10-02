using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Blue.Cosacs.Stock;
using Blue.Cosacs.Warranty;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Transactions;
using model = Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Stock.Repositories;
using System.Linq.Expressions;
using System;
using System.Text;
using Blue.Glaucous.Client.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class LinkController : Controller
    {
        public LinkController(WarrantyLinkRepository warrantyLinkRepository,
                              WarrantyPriceRepository warrantyPriceRepository,
                              WarrantyPromotionRepository warrantyPromotionRepository,
                              ProductRepository productRepository,
                              MerchandisingRef.Settings merchandisingSettings, 
                              MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo)
        {
            this.warrantyLinkRepository = warrantyLinkRepository;
            this.warrantyPriceRepository = warrantyPriceRepository;
            this.warrantyPromotionRepository = warrantyPromotionRepository;
            this.productRepository = productRepository;
            this.merchandisingSettings = merchandisingSettings;
            this.merchandisingTaxRepo = merchandisingTaxRepo;

        }

        private readonly WarrantyPriceRepository warrantyPriceRepository;
        private readonly WarrantyLinkRepository warrantyLinkRepository;
        private readonly WarrantyPromotionRepository warrantyPromotionRepository;
        private readonly ProductRepository productRepository;
        private readonly MerchandisingRef.Settings merchandisingSettings;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkView)]
        public ActionResult Index()
        {
            ViewBag.viewLinkPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantyProductLinkView);
            ViewBag.editLinkPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantyProductLinkEdit);

            return View();
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkView)]
        public ActionResult Get(string name)
        {
            ViewBag.viewLinkPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantyProductLinkView);
            ViewBag.editLinkPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantyProductLinkEdit);

            return View("Index", model: name);
        }

        private Dictionary<string, Solr.Request.Filter> GetFacetFields(WarrantyProductLinkSearch link)
        {
            var fields = new Dictionary<string, Solr.Request.Filter>();

            var jsObject = new JavaScriptSerializer().Deserialize<Dictionary<string, string>>(new JavaScriptSerializer().Serialize(link));
            foreach (var key in jsObject.Keys)
            {
                if (!string.IsNullOrWhiteSpace(jsObject[key]))
                {
                    fields.Add(key, new Solr.Request.Filter
                    {
                        Values = new System.Collections.ArrayList(new string[] { jsObject[key] })
                    });
                }
            }

            return fields;
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkEdit)]
        [HttpPost]
        public JsonResult ValidateNewLinkWarranty(int warrantyId, model.WarrantyLink warrantyLink)
        {
            var msg = warrantyLinkRepository.ValidateNewWarrantyLink(warrantyId, warrantyLink);
            var isValid = (string.IsNullOrEmpty(msg));
            var json = new { isValid = isValid, msg = msg };

            return Json(json, JsonRequestBehavior.AllowGet);
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkEdit)]
        [HttpPost]
        public JsonResult Create(model.WarrantyLink warrantyLink)
        {
            var ret = new { id = -1, msg = "" };

            try
            {
                ret = new { id = warrantyLinkRepository.Save(warrantyLink), msg = "" };
            }
            catch (Exception ex)
            {
                ret = new { id = -1, msg = ex.Message };
            }

            return Json(ret, JsonRequestBehavior.AllowGet);
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkEdit)]
        [HttpDelete]
        public void Delete(int id)
        {
            warrantyLinkRepository.Delete(id);
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkView)]
        [HttpPost]
        public JsonResult GetAll(WarrantyLinkSearch search)
        {
            return Json(warrantyLinkRepository.Get(search),
                        JsonRequestBehavior.AllowGet);
        }

        [Permission(WarrantyPermissionEnum.WarrantyProductLinkView)]
        [HttpGet]
        public JsonResult GetLink(int id)
        {
            return Json(warrantyLinkRepository.Get(
                                                   new Blue.Cosacs.Warranty.Model.WarrantyLinkSearch
                                                   {
                                                       Id = id
                                                   }).Page.FirstOrDefault(),
                        JsonRequestBehavior.AllowGet);
        }

        [Permission(WarrantyPermissionEnum.WarrantySimulatorView)]
        private string SearchSolr(string q = "", string[] facets = null, int start = 0, int rows = 0, string type = "Product", bool showEmpty = true)
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: facets,
                    showEmpty: showEmpty,
                   start: start,
                   rows: rows
                   );
        }

        [Permission(WarrantyPermissionEnum.WarrantySimulatorView)]
        public ActionResult Simulator()
        {
            ViewBag.viewSimulatorPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantySimulatorView);

            return View();
        }

        // This is required by cosacs winforms. If we add permission we should up date the exception display in winforms too.
        public JsonResult Search(WarrantySearchByProduct search, string typeCode = "")
        {
            var TaxRate = GetCountryTaxRate();
            var TaxType = merchandisingSettings.TaxInclusive ? "I" : "E";

            var warrantyLinks = warrantyLinkRepository.SearchByProduct(search, typeCode);
            if (warrantyLinks != null)
            {
                var CountWarranties = warrantyLinks.Items.Count();
                var CountNoWarranties = warrantyLinks.ItemsWithoutWarranties.Count();
                var PageIndex = search.PageIndex;
                var PageSize = search.PageSize;

                // Detect WinCosacs Non-Paging
                IEnumerable<WarrantyLinkResult> itemsPaged = null;
                IEnumerable<WarrantyProductLinkSearch> itemsWithoutWarrantiesPaged = null;
                if (PageIndex > 0 && PageSize > 0)
                {
                    itemsPaged = warrantyLinks.Items.Skip(GetNumberOfItemsToSkip(search))
                                                    .Take(PageSize);
                    itemsWithoutWarrantiesPaged =
                        warrantyLinks.ItemsWithoutWarranties.Skip(GetNumberOfItemsToSkip(search))
                                                            .Take(PageSize);
                }

                return Json(new
                {
                    warrantyLinks.ProductPrice,
                    Items = itemsPaged ?? warrantyLinks.Items,
                    ItemsWithoutWarranties = itemsWithoutWarrantiesPaged ?? warrantyLinks.ItemsWithoutWarranties,
                    CountWarranties,
                    CountNoWarranties,
                    PageIndex,
                    PageSize,
                }, JsonRequestBehavior.AllowGet);
            }

            return Json(new { }, JsonRequestBehavior.AllowGet);
        }

        private int GetNumberOfItemsToSkip(WarrantySearchByProduct search)
        {
            if (search.PageIndex > 0)
            {
                return (search.PageIndex - 1) * search.PageSize;
            }

            throw (new Exception("Simulator Paging Error - The page number cannot be smaller than 1."));
        }

        public FileResult SearchExport(WarrantySearchByProduct search,
            string fileName = "export.csv", string typeCode = "")
        {
            var warrantyLinks = warrantyLinkRepository.SearchByProduct(search, typeCode);

            var searchProductWithoutWarranty = Request.QueryString["withWarranties"] == "0";

            var file = new StringBuilder();
            if (warrantyLinks != null)
            {
                if (searchProductWithoutWarranty)
                {
                    file.AppendLine(GetItemsWithoutWarrantyLinkItemLine(null, true));
                    foreach (var item in warrantyLinks.ItemsWithoutWarranties)
                    {
                        file.AppendLine(GetItemsWithoutWarrantyLinkItemLine(item));
                    }
                }
                else
                {
                    file.AppendLine(GetWarrantyLinkItemLine(null, true));
                    foreach (var item in warrantyLinks.Items)
                    {
                        file.AppendLine(GetWarrantyLinkItemLine(item));
                    }
                }
            }

            return File(Encoding.GetEncoding("UTF-8").GetBytes(file.ToString()), "text/plain", fileName);
        }

        private string GetWarrantyLinkItemLine(WarrantyLinkResult item, bool returnHeader = false)
        {
            if (returnHeader)
            {
                return string.Format(
                    "\"{0}\",\"{1}\",\"{2}\",\"{3}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\",\"{8}\",\"{9}\",\"{10}\",\"{11}\",\"{12}\"",
                    "Product No.",
                    "Product Description",
                    "Product Retail Price",
                    "Warranty/Product Price(%)",
                    "Link",
                    "Warranty",
                    "Warranty Length (Months)",
                    "Warranty Tax(%)",
                    "Warranty Price",
                    "Is Free",
                    "Promotion Link",
                    "Promotion Price",
                    "Promotion Match Type"
                    );
            }
            else
            {
                PromotionAggregate promotion = null;
                if (item.promotion != null && item.promotion.Promotion != null)
                {
                    promotion = item.promotion.Promotion;
                }

                var ProductRetailPrice = "None";
                var tmpProductRetailPrice = 0.0M;
                if (decimal.TryParse(item.warrantyLink.ProductRetailPrice, out tmpProductRetailPrice))
                {
                    ProductRetailPrice = tmpProductRetailPrice.ToString("0.00");
                }

                var WarrantyPrice = "None";
                if (item.price.RetailPrice != null && item.price.RetailPrice > 0)
                {
                    WarrantyPrice = item.price.RetailPrice.Value.ToString("0.00");
                }

                var PromotionMatchType = string.Empty;
                if (item.promotion != null)
                {
                    if (promotion.WarrantyId.HasValue)
                        PromotionMatchType = "Promotion match on warranty Id";
                    else
                        PromotionMatchType = "Promotion match on lowest level";
                }

                return string.Format(
                    "\"{0}\",\"{1}\",\"{2}\",\"{3}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\",\"{8}\",\"{9}\",\"{10}\",\"{11}\",\"{12}\"",
                    EscapeQuotes(item.warrantyLink.ProductItemNo),
                    EscapeQuotes(item.warrantyLink.ProductDescription),
                    EscapeQuotes(ProductRetailPrice),
                    item.WarrantyProductPricePercentage.ToString("0.00"),
                    EscapeQuotes(item.warrantyLink.LinkName),
                    EscapeQuotes(item.warrantyLink.Number + " - " + item.warrantyLink.Description),
                    item.warrantyLink.Length,
                    item.warrantyLink.TaxRate,
                    EscapeQuotes(WarrantyPrice),
                    EscapeQuotes(item.warrantyLink.TypeCode == WarrantyType.Free ? "Yes" : "No"),
                    EscapeQuotes(promotion != null ? promotion.PromoId.ToString() : string.Empty),
                    EscapeQuotes(item.promotion != null ? item.promotion.Price.ToString() : "None"),
                    EscapeQuotes(PromotionMatchType)
                    );
            
            }
        }

        private string GetItemsWithoutWarrantyLinkItemLine(WarrantyProductLinkSearch item, bool returnHeader = false)
        {
            if (returnHeader)
            {
                return string.Format(
                    "\"{0}\",\"{1}\",\"{2}\",\"{3}\"",
                    "Product No.",
                    "Product Description",
                    "Product Category",
                    "Product Retail Price"
                    );
            }
            else
            {
                var CashPrice = "None";
                if (item.CashPrice != null || item.CashPrice.Length > 0)
                {
                    CashPrice = item.CashPrice;
                }

                return string.Format(
                    "\"{0}\",\"{1}\",\"{2}\",\"{3}\"",
                    EscapeQuotes(item.ItemNoWarrantyLink),
                    EscapeQuotes(item.Description),
                    EscapeQuotes(item.Category),
                    EscapeQuotes(CashPrice)
                    );
            }
        }

        private string EscapeQuotes(string val)
        {
            return val.Replace("\"", "\"\"");
        }

        // This is required by cosacs winforms. If we add permission we should up date the exception display in winforms too.
        public JsonResult SearchMany(model.WarrantySearchByProduct[] search)
        {

            var results = new List<WarrantySearchByProductResult>();
            var count =0;
            foreach (var p in search)
            {
                var result = warrantyLinkRepository.SearchByProduct(p);
                if (result != null)
                    results.Add(result);
                // #18528 - temp fix exit after 5 products
                count ++;
                if (count >=5) 
                    break;
            }
            return Json(results, JsonRequestBehavior.AllowGet);
        }

        // This is required by cosacs winforms. If we add permission we should up date the exception display in winforms too.
        public JsonResult SearchFree(model.WarrantySearchByProduct search)
        {
            var warrantyLinks = warrantyLinkRepository.Search(search);

            if (warrantyLinks.Items != null && warrantyLinks.Items.Count() > 0)
            {
                var warrantIds = warrantyLinks.Items.Select(i => i.Id).ToList();

                var items = from i in warrantyLinks.Items
                            where i.TypeCode == WarrantyType.Free
                            select new
                            {
                                warrantyLink = i
                            };

                if (items.Any(w => w.warrantyLink.ProductMatch))
                    items = items.Where(w => w.warrantyLink.ProductMatch);

                items = items.OrderByDescending(i => i.warrantyLink.LevelMatch).Take(1);

                return Json(new
                {
                    ProductPrice = warrantyLinks.ProductPrice,
                    Items = items
                }, JsonRequestBehavior.AllowGet);
            }
            else
                return Json(new
                {
                }, JsonRequestBehavior.AllowGet);
        }

        // This is required by cosacs winforms. If we add permission we should up date the exception display in winforms too.
        public JsonResult SearchRenewals(WarrantyLocation[] warrantyLocation)
        {
            return Json(warrantyLinkRepository.GetRenewals(warrantyLocation), JsonRequestBehavior.AllowGet);
        }

        private decimal GetCountryTaxRate()
        {
            var currentTaxRateObj = merchandisingTaxRepo.GetCurrent();
            if (currentTaxRateObj != null)
            {
                return merchandisingTaxRepo.GetCurrent().Rate * 100;
            }
            return 0;
        }

    }
}
