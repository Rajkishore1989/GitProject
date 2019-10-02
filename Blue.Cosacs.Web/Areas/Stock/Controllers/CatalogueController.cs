using Blue.Cosacs.Stock.Repositories;
using Blue.Cosacs.Stock.Solr;
using Blue.Glaucous.Client.Mvc;
using System.Collections.Generic;
using System.Web.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;

namespace Blue.Cosacs.Web.Areas.Stock.Controllers
{
    using Blue.Glaucous.Client.Api;

    public class CatalogueController : Controller
    {
        private readonly ProductRepository productRepository;
        private readonly MerchandisingRef.Settings merchandisingSettings;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;

        public CatalogueController(
            ProductRepository productRepository,
            MerchandisingRef.Settings merchandisingSettings,
            MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo)
        {
            this.productRepository = productRepository;
            this.merchandisingSettings = merchandisingSettings;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
        }

        public ActionResult Index()
        {
            return View();
        }

        // This method supports WinCosacs Functionality, it's used to Reindex 'Winform Stock' option
        // (menu Configuration -> Re-Indexing page). And will be scrapped with WinCosacs, yay!!!  :)
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        
        [CronJob]
        [LongRunningQueries]
        public void ForceIndex()
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };
            new SolrIndex().Index(taxSettings);
        }

        public JsonResult GetInstallations(string itemNumber)
        {
            var installations = productRepository.GetInstallations(itemNumber, this.GetUser().Branch);
            return Json(installations, JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetProductRelationsData()
        {
            return Json(
            new
            {
                tree = Blue.Cosacs.Stock.ProductRelations.Tree,
                levels = Blue.Cosacs.Stock.ProductRelations.Levels
            }, 
            JsonRequestBehavior.AllowGet);
        }

        public IEnumerable<KeyValuePair<string, string>> GetProductLevelNames()
        {
            return Blue.Cosacs.Stock.ProductRelations.Levels;
        }

        private string SearchSolr(string q = "", string[] facets = null, int start = 0, int rows = 0, string type = "Product", bool showEmpty = true)
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: facets,
                    showEmpty: showEmpty,
                   start: start,
                   rows: rows);
        }

        private decimal GetCountryTaxRate()
        {
            var currentTaxRateObj = merchandisingTaxRepo.GetCurrent();
            if (currentTaxRateObj != null)
            {
                return currentTaxRateObj.Rate * 100;
            }
            return 0;
        }

        private class CosacsTaxSettings : ICosacsTaxSettings
        {
            public decimal TaxRate { get; set; }
            public string TaxType { get; set; }
        }
    }
}
