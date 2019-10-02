namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Solr;
    using Blue.Glaucous.Client.Mvc;

    using Newtonsoft.Json;

    using Promotion = Blue.Cosacs.Merchandising.Models.Promotion;

    public class PromotionController : Controller
    {
        private readonly ILocationRepository locationRepository;
        private readonly IPromotionRepository promotionRepository;
        private readonly IRetailPriceRepository retailPriceRepository;
        private readonly IPromotionSolrIndexer promotionSolrIndexer;

        private readonly IStockSummarySolrIndexer stockSummarySolrIndexer;

        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public PromotionController(IMerchandisingHierarchyRepository hierarchyRepository, ILocationRepository locationRepository, IPromotionRepository promotionRepository, IRetailPriceRepository retailPriceRepository, IPromotionSolrIndexer promotionSolrIndexer, IStockSummarySolrIndexer stockSummarySolrIndexer)
        {
            this.hierarchyRepository = hierarchyRepository;
            this.locationRepository = locationRepository;
            this.promotionRepository = promotionRepository;
            this.retailPriceRepository = retailPriceRepository;
            this.promotionSolrIndexer = promotionSolrIndexer;
            this.stockSummarySolrIndexer = stockSummarySolrIndexer;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.PromotionEdit)]
        public ActionResult New()
        {
            var hierarchyOpts = this.hierarchyRepository.GetSortedList().ToList();
            var hierarchy = hierarchyOpts.ToDictionary(h => h.Key, h => string.Empty);

            var locations = this.locationRepository.GetList();

            var model = new PromotionViewModel()
            {
                HierarchyOptions = hierarchyOpts,
                Hierarchy = hierarchy,
                Locations = locations,
                Promotion = new Promotion()
            };

            return View("Detail", model);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.PromotionView)]
        public ActionResult Detail(int id)
        {
            var promo = promotionRepository.Get(id);

            if (promo == null)
            {
                throw new Exception("Can not find Promotion. Please try reindexing.");
            }

            var locations = this.locationRepository.GetList();

            var hierarchyOpts = this.hierarchyRepository.GetSortedList().ToList();
            var hierarchy = hierarchyOpts.ToDictionary(h => h.Key, h => string.Empty);

            var model = new PromotionViewModel() { HierarchyOptions = hierarchyOpts, Hierarchy = hierarchy, Locations = locations, Promotion = promo };

            return View("Detail", model);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.PromotionEdit)]
        public JsonResult Save(Promotion promotion)
        {
            if (promotion.EndDate.Value.Date < promotion.StartDate.Value.Date)
            {
                ModelState.AddModelError("EndDate", "End date must be on or after start date");
            }
            //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
            if (promotion.EndDate.Value.TimeOfDay < promotion.StartDate.Value.TimeOfDay)
            {
                ModelState.AddModelError("EndDate", "End Time must be on or after Start Time");
            }
            if (!promotion.Id.HasValue && promotion.StartDate.Value.Date < DateTime.Now.Date)
            {
                ModelState.AddModelError("StartDate", "Start date cannot be in the past");
            }

            if (!promotion.Id.HasValue && promotion.StartDate.Value.Date == DateTime.Now.Date)
            {
                if (!promotion.Id.HasValue && promotion.StartDate.Value.TimeOfDay < DateTime.Now.TimeOfDay)
                {
                    ModelState.AddModelError("StartDate", "Start time cannot be in the past");
                }
            }

            if (!promotionRepository.IsNameUnique(promotion.Name, promotion.Id))
            {
                ModelState.AddModelError("Name", "Promotion name must be unique");
            }

            if (
                promotion.Details.Any(
                    d =>
                    d.ProductId.HasValue
                    && promotionRepository.ProductExistsInAnotherPromo(
                        d.ProductId.Value,
                        d.PriceTypeName,
                        promotion.Id,
                        promotion.StartDate.Value,
                        promotion.EndDate.Value,
                        promotion.LocationId,
                        promotion.Fascia

                        
                       )))
            {
                ModelState.AddModelError("ProductId", "Cannot add a product that exists in another promotion active during the same period");
            }

            if (promotion.Id.HasValue)
            {
                var existingPromotion = promotionRepository.Get(promotion.Id.Value);

                if (existingPromotion.EndDate.HasValue && existingPromotion.EndDate.Value.Date < DateTime.Now.Date)
                {
                    ModelState.AddModelError("EndDate", "Cannot change a promotion once it has finished");
                }

                // promotion has started
                if (promotion.StartDate.HasValue && existingPromotion.StartDate.Value.Date <= DateTime.Now.Date)
                {
                    if (promotion.StartDate != existingPromotion.StartDate)
                    {
                        ModelState.AddModelError("StartDate", "Cannot change a start date if a promotion has already started");
                    }

                    if (!promotion.Details.TrueForAll(d => existingPromotion.Details.Select(ep => ep.ProductId).Contains(d.ProductId)))
                    {
                        ModelState.AddModelError("ProductId", "Cannot add products to a promotion that has already started");
                    }
                    //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
                    if (existingPromotion.StartDate.Value.TimeOfDay < DateTime.Now.TimeOfDay)
                    {
                        ModelState.AddModelError("StartTime", "Cannot change a start time if a promotion has already started");
                    }
                }


                }

            if (promotion.Details.Where(p => p.ProductId.HasValue).GroupBy(d => new { d.ProductId, d.PriceType }).Any(g => g.Count() > 1))
            {
                ModelState.AddModelError("ProductId", "Cannot add the same product multiple times in a promotion");
            }

            if (ModelState.IsValid)
            {
                var model = promotionRepository.Save(promotion);
                this.ForceIndex(new[] { model.Id.Value });

                this.IndexProducts(model);

                return new JSendResult(JSendStatus.Success, model);
            }

            var errors = string.Join(",", this.ModelState.GetErrors());
            return new JSendResult(JSendStatus.BadRequest, message: errors);
        }

        private void IndexProducts(Promotion model)
        {
            using (var scope = Context.Read())
            {
                var productIds = model.Details.Where(p => p.ProductId != null).Select(p => p.ProductId.Value).ToList();

                var promoHierarchies =
                    model.Details.Where(p => p.Hierarchies.Any())
                        .SelectMany(p => p.Hierarchies)
                        .GroupBy(p => p.Id, h => new { LevelId = h.LevelId, TagId = h.TagId })
                        .Select(p => p.ToDictionary(k => k.LevelId, v => v.TagId))
                        .Distinct()
                        .ToList();

                var productHierarchies =
                    scope.Context.ProductHierarchyView.AsNoTracking()
                        .Where(
                            p =>
                            p.Status != (int)ProductStatuses.NonActive
                            && (p.ProductType == ProductTypes.RegularStock || p.ProductType == ProductTypes.Set || p.ProductType == ProductTypes.ProductWithoutStock));

                foreach (var promoHierarchy in promoHierarchies)
                {
                    productIds = productIds.Union(this.promotionRepository.CalculateEffectedProducts(promoHierarchy, productHierarchies)).ToList();
                }

                this.stockSummarySolrIndexer.Index(productIds);
            }
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.PromotionView)]
        public ActionResult Index(string q = "")
        {
            var standardFields = new[] { "\"LocationName\" : \"Location\"", "\"Fascia\" : \"Fascia\"", "\"PromotionType\" : \"Promotion Type\"" };
            var levelFields = hierarchyRepository.GetAllLevels().Select(l => string.Format("\"MerchandisingLevel_{0}\" : \"{1}\"", l.Id, l.Name));
            ViewBag.labels = "{ " + string.Join(", ", levelFields.Union(standardFields)) + " }";
            return View(model: SearchSolr(q, new[] { "LocationName", "Fascia", "PromotionType" }));
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SelectSearch(string q, int? locationId, string fascia, DateTime effectiveDate)
        {
            if (!q.EndsWith("*"))
            {
                q = q + "*";
            }
            var solrQuery = new Query();

            try
            {
                const string Filter =
                    "Type:MerchandiseStockSummary AND !ProductType:RepossessedStock AND !ProductType:SparePart AND !ProductType:Combo AND !ProductStatus:Deleted AND !ProductStatus:\"Non Active\"";
                var solrResult = solrQuery.SelectAllRows(string.Format("{{\"query\":\"{0}\"}}", q), "ProductId,ProductType,Sku,LongDescription", Filter);
                var deserialised = ((Result)new JsonSerializer().Deserialize(new StringReader(solrResult), typeof(Result))).Response.Docs;
                var queryProductIds = deserialised.Select(p => int.Parse(p["ProductId"].ToString())).ToArray();
                var validProductIds = retailPriceRepository.ExistsForLocationEffectiveDate(locationId, fascia, queryProductIds.ToList(), effectiveDate);
                var validResults =
                    deserialised.Where(p => validProductIds[int.Parse(p["ProductId"].ToString())])
                        .Select(p => new { Sku = p["Sku"].ToString(), LongDescription = p["LongDescription"].ToString(), ProductId = int.Parse(p["ProductId"].ToString()) });
                return new JSendResult(JSendStatus.Success, validResults);
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

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.PromotionView)]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, new[] { "LocationName", "Fascia", "PromotionType" }, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, string[] nonHierarchyFields, int start = 0, int rows = 25, string type = "MerchandisePromotion")
        {
            var fields = hierarchyRepository.GetAllLevels().Select(l => "MerchandisingLevel_" + l.Id).Concat(nonHierarchyFields);

            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: fields.ToArray(),
                showEmpty: true,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] promotionIds = null)
        {
            this.promotionSolrIndexer.Index(promotionIds);
        }
    }
}
