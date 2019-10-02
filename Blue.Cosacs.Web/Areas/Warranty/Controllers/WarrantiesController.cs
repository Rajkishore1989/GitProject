using Blue.Cosacs.Warranty.Repositories;
using Blue.Cosacs.Web.Areas.Warranty.Common;
using Blue.Glaucous.Client.Mvc;
using System;
using System.Linq;
using System.Web.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantiesController : Controller
    {
        public WarrantiesController(WarrantyHierachyRepository warrantyHierachyRepository,
            WarrantyPriceRepository warrantyPricesRepository, Search search,
            MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo)
        {
            this.search = search;
            this.warrantyHierachyRepository = warrantyHierachyRepository;
            this.warrantyPricesRepository = warrantyPricesRepository;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
        }

        private readonly Search search;
        private readonly WarrantyHierachyRepository warrantyHierachyRepository;
        private readonly WarrantyPriceRepository warrantyPricesRepository;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.SearchView)]
        public ActionResult Index(string q = "")
        {
            ViewBag.title = "Search Warranty";
            ViewBag.viewPermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView);
            LoadMasterDataForWarrantyEdit();
            var standardFields = new string[] { "\"BranchType\" : \"Store Type\"", "\"BranchNumber\" : \"Branch\"", "\"Length\" : \"Length (Months)\"", "\"WarrantyHasPrices\" : \"With Prices\"", "\"WarrantyType\" : \"Warranty Type\"", "\"Deleted\" : \"Is Deleted\"" };
            var levelFields = warrantyHierachyRepository.GetAllLevels().Select(l => String.Format("\"Level_{0}\" : \"{1}\"", l.Id, l.Name));
            ViewBag.labels = "{ " + String.Join(", ", levelFields.Union(standardFields)) + " }";
            return View(model: search.SearchSolr(q, new[] { "BranchType", "BranchNumber", "WarrantyType", "WarrantyHasPrices", "WarrantyType", "Length", "Deleted" }));
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView)]
        public ActionResult Get(int id)
        {
            LoadMasterDataForWarrantyEdit();
            return View("Warranty");
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView)]
        public ActionResult New()
        {
            LoadMasterDataForWarrantyEdit();
            return View("Warranty", 0);
        }

        private void LoadMasterDataForWarrantyEdit()
        {
            ViewBag.branches = new Blue.Cosacs.Web.Common.BranchPickListProvider().Load().ToDictionary(r => r.k, r => r.v).ToJson();
            ViewBag.branchTypes = new Blue.Cosacs.Web.Common.SetsPickListProvider("fascia").Load().ToDictionary(r => r.k, r => r.v).ToJson();
            ViewBag.editPricePermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PricesEdit);
            ViewBag.viewPromotionsPermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView);
            ViewBag.defaultTaxRate = GetCountryTaxRate();
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
