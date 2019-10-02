using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Cosacs.Web.Areas.Warranty.Common;
using Blue.Solr;
using Newtonsoft.Json;
using Blue.Cosacs.Warranty.Solr;
using Blue.Glaucous.Client.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantyPricesController : Controller
    {
        private readonly Search search;
        private readonly WarrantyHierachyRepository warrantyHierachyRepository;
        private readonly WarrantyPriceRepository warrantyPricesRepository;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;
        private readonly MerchandisingRef.Settings merchandisingSettings;

        public WarrantyPricesController(WarrantyPriceRepository warrantyPricesRepository, WarrantyHierachyRepository warrantyHierachyRepository, Search search,
            MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo, MerchandisingRef.Settings merchandisingSettings)
        {
            this.warrantyPricesRepository = warrantyPricesRepository;
            this.search = search;
            this.warrantyHierachyRepository = warrantyHierachyRepository;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
            this.merchandisingSettings = merchandisingSettings;

        }

        public ActionResult Index(string q = "")
        {
            ViewBag.title = "Warranty Pricing";
            ViewBag.viewWarrantyPermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView);
            ViewBag.editPricePermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit);
            ViewBag.branches = new Blue.Cosacs.Web.Common.BranchPickListProvider().Load().ToDictionary(r => r.k, r => r.v).ToJson();
            ViewBag.branchTypes = new Blue.Cosacs.Web.Common.SetsPickListProvider("fascia").Load().ToDictionary(r => r.k, r => r.v).ToJson();
            var standardFields = new string[] { "\"BranchType\" : \"Store Type\"", "\"BranchNumber\" : \"Branch\"", "\"WarrantyHasPrices\" : \"With Prices\"" };
            var levelFields = warrantyHierachyRepository.GetAllLevels().Select(l => String.Format("\"Level_{0}\" : \"{1}\"", l.Id, l.Name));
            ViewBag.labels = "{ " + String.Join(", ", levelFields.Union(standardFields)) + " }";
            return View(model: search.SearchSolr(q, new[] { "BranchType", "BranchNumber", "WarrantyHasPrices" }));
        }

        public void Search(string q, int start = 0, int rows = 25)
        {
            Response.Write(search.SearchSolr(q, new[] { "BranchType", "BranchNumber", "WarrantyType", "WarrantyHasPrices", "Length", "Deleted" }, start, rows));
        }

        public ActionResult GetPrices(int id)
        {
            return Json(warrantyPricesRepository.GetWarrantyPrices(id), JsonRequestBehavior.AllowGet);
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        [HttpPost]
        public ActionResult GetBulkEditInfo(Models.BulkEditRequest bulkEditRequest)
        {
            var filteredIds = GetWarrantyIds(bulkEditRequest.Filter);
            var result = warrantyPricesRepository.GetBulkEditInfo(filteredIds, bulkEditRequest.EditRequest);

            return Json(new { BulkEditInfo = result });
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        [HttpPost]
        public ActionResult BulkEditPrices(Models.BulkEditRequest bulkEditRequest)
        {
            var filteredIds = GetWarrantyIds(bulkEditRequest.Filter);
            warrantyPricesRepository.InsertBulkEdit(filteredIds, bulkEditRequest.EditRequest);

            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            SolrIndex.IndexWarranty(taxSettings,filteredIds);

            return Json(new { Success = true });
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        [HttpPost]
        public ActionResult DeleteBulkEdit(int bulkEditId)
        {
            return Json(new { Result = warrantyPricesRepository.DeleteBulkEdit(bulkEditId) });
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        public ActionResult Create(WarrantyLocationPrice locationPrice)
        {
            try
            {
                var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
                var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

                var price = warrantyPricesRepository.Save(locationPrice);
                SolrIndex.IndexWarranty(taxSettings,new int[] { price.WarrantyId });
                return Json(price);
            }
            catch (OperationCanceledException ex)
            {
                return Json(new { hasError = true, message = ex.Message });
            }
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        public ActionResult Update(WarrantyLocationPrice locationPrice)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            var price = warrantyPricesRepository.Save(locationPrice);
            SolrIndex.IndexWarranty(taxSettings,new int[] { price.WarrantyId });
            return Json(price);
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit)]
        public ActionResult Delete(int id)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            var price = warrantyPricesRepository.Delete(id);
            SolrIndex.IndexWarranty(taxSettings,new int[] { price.WarrantyId });

            return Json(new { Success = true });
        }

        private static int[] GetWarrantyIds(string filter)
        {
            const string fieldName = "WarrantyId";
            var solrResponse = new Blue.Solr.Query().SelectAllRows(filter, fieldName, "Type:" + Blue.Cosacs.Warranty.Solr.SolrIndex.SolrType);

            return ((Result)new JsonSerializer().Deserialize(new StringReader(solrResponse), typeof(Result))).Response.Docs
                .Select(p => int.Parse(p[fieldName].ToString()))
                .ToArray();
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

        private class CosacsTaxSettings : ICosacsTaxSettings
        {
            public decimal TaxRate { get; set; }
            public string TaxType { get; set; }
        }
     
    }
}
