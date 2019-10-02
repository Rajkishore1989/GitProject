using Blue.Cosacs.Warranty.Repositories;
using Blue.Cosacs.Warranty.Solr;
using Blue.Cosacs.Web.Areas.Warranty.Common;
using Blue.Cosacs.Web.Helpers;
using Blue.Glaucous.Client.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;
using War = Blue.Cosacs.Warranty.Model;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantyAPIController : Controller
    {
        public WarrantyAPIController(WarrantyRepository warrantyRepository,
            WarrantyHierachyRepository warrantyHierachyRepositoy, HierarchyController hierarchyController,
            Search search, MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo, MerchandisingRef.Settings merchandisingSettings)
        {
            this.warrantyRepository = warrantyRepository;
            this.warrantyHierachyRepositoy = warrantyHierachyRepositoy;
            this.hierarchyController = hierarchyController;
            this.search = search;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
            this.merchandisingSettings = merchandisingSettings;
        }

        private readonly WarrantyRepository warrantyRepository;
        private readonly WarrantyHierachyRepository warrantyHierachyRepositoy;
        private readonly HierarchyController hierarchyController;
        private readonly Search search;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;
        private readonly MerchandisingRef.Settings merchandisingSettings;

        [HttpPost]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.EditWarranty)]
        public JsonResult Create(War.Warranty warranty)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            if (!TryValidateModel(warranty))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return Json(ModelState.ErrorsToArray());
            }
            else
            {

                var id = warrantyRepository.Create(warranty);
                if (id > 0)
                {
                    SolrIndex.IndexWarranty(taxSettings,new[] { id });
                    return Json(new { id = id }, JsonRequestBehavior.AllowGet);
                }
                else
                    return Json(new { error = true }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView)]
        public JsonResult Get(int id)
        {
            var defaultTaxRate = GetCountryTaxRate();
            var warranty = new War.Warranty
            {
                TaxRate = defaultTaxRate
            };

            if (id != 0)
            {
                warranty = warrantyRepository.Get(id);
            }

            return Json(new
            {
                warranty = warranty,
                masterData = new
                {
                    warrantyHierarchy = warrantyHierachyRepositoy.GetTagSelection(),
                    defaultTaxRate
                }
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPut]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.EditWarranty)]
        public JsonResult Update(int id, War.Warranty warranty)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            if (!TryValidateModel(warranty))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return Json(ModelState.ErrorsToArray());
            }
            else
            {
                var error = warrantyRepository.Update(warranty);
                if (!error)
                    SolrIndex.IndexWarranty(taxSettings,new[] { warranty.Id });
                return Json(new { error = error }, JsonRequestBehavior.AllowGet);
            }
        }

        [Permission(Blue.Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] warrantyIds = null)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            Blue.Cosacs.Warranty.Solr.SolrIndex.IndexWarranty(taxSettings,warrantyIds);
        }

        [HttpPost]
        public JsonResult ChangeWarrantyTag(int sourceTagId, int destinationTagId)
        {
            if (sourceTagId == 0 || destinationTagId == 0)
            {
                return Json(new { Success = false, Reason = "Source Tag and Destination Tag Ids must be specified" });
            }

            var ids = warrantyRepository.ChangeWarrantyTag(sourceTagId, destinationTagId);
            ForceIndex(ids.ToArray());

            return Json(new { Success = true, HierarchyData = hierarchyController.GetHierarchyData().Data });
        }

        [HttpPost]
        public JsonResult AssignWarrantyTag(int levelId, int tagId)
        {
            if (levelId == 0 || tagId == 0)
            {
                return Json(new { Success = false, Reason = "Level Id and Tag Id must be specified" });
            }

            var ids = warrantyRepository.AssignWarrantyTag(levelId, tagId);
            ForceIndex(ids.ToArray());

            return Json(new { Success = true, HierarchyData = hierarchyController.GetHierarchyData().Data });
        }

        [HttpPost]
        public JsonResult AssociateUnassignedWarranties(int levelId, string destinationTagName)
        {
            if (levelId == 0)
            {
                return Json(new { Success = false, Reason = "You must specify the Level at which to create the new Tag" });
            }

            if (string.IsNullOrWhiteSpace(destinationTagName))
            {
                return Json(new { Success = false, Reason = "You must specify a name for the new Tag" });
            }
            return Json(new { Success = true });
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.SearchView)]
        public void Search(string q, int start = 0, int rows = 25)
        {
            Response.Write(search.SearchSolr(q, new[] { "BranchType", "BranchNumber", "WarrantyType", "WarrantyHasPrices", "Length", "Deleted" }, start, rows));
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.SearchView)]
        public void SelectSearch(string q, string filter = "", int rows = 25, bool filterReplacement = false)
        {
            if (!q.EndsWith("*"))
            {
                q = q + "*";
            }

            if (!q.StartsWith("*"))
            {
                q = "*" + q;
            }

            var searchResults = filterSearchResults(filter, search.SearchSolrWarrantiesSelect(q, rows, filterReplacement));

            Response.Write(searchResults);
        }

        private string filterSearchResults(string filter, string searchResults)
        {
            var newSearchResults = string.Empty;

            if (!string.IsNullOrWhiteSpace(filter))
            {
                var objTemplate = new
                {
                    response = new
                    {
                        docs = new List<object>() {
                            new {
                                Id = "",
                                Type = "",
                                WarrantyId = 0,
                                WarrantyNumber = "",
                                ItemDescription = "",
                                Length = 0,
                                TaxRate = 0.0,
                                Free = "",
                                Deleted = "",
                                WarrantyHasPrices = "",
                                _version_ = 0,
                                score = 1.0
                            }
                        }
                    }
                };
                dynamic solrData =
                    Newtonsoft.Json.JsonConvert.DeserializeAnonymousType(searchResults, objTemplate);

                var filteredDocs = new List<object>();
                foreach (var d in solrData.response.docs)
                {
                    string tmpId = d.WarrantyId.ToString();
                    if (!filter.Split(new char[] { ',' }).Contains(tmpId))
                    {
                        filteredDocs.Add(d);
                    }
                }

                newSearchResults = Newtonsoft.Json.JsonConvert.SerializeObject(
                    new
                    {
                        response = new
                        {
                            docs = filteredDocs
                        }
                    });
            }
            if (newSearchResults != string.Empty)
                return newSearchResults;
            else
                return searchResults;
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
