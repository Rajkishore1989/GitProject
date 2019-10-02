using System.Data.Entity.Infrastructure;
using System.Web.Mvc;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Glaucous.Client.Mvc;
using MerchandisingRef = Blue.Cosacs.Merchandising;
using Blue.Cosacs.Warranty.Solr;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class LevelsController : Controller
    {
        private WarrantyHierachyRepository warrantyRepository;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;
        private readonly MerchandisingRef.Settings merchandisingSettings;

        public LevelsController(WarrantyHierachyRepository warrantyRepository, MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo, 
            MerchandisingRef.Settings merchandisingSettings)
        {
            this.warrantyRepository = warrantyRepository;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
            this.merchandisingSettings = merchandisingSettings;
        }

        [HttpPost]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.HierarchyManagement)]
        public ActionResult Create(Models.Level level)
        {
            try
            {
                var newLevel = warrantyRepository.Save(new WarrantyLevel { Name = level.Name });
                return Json(new { Level = new Models.Level(newLevel) });
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Level = level, Message = message });
            }
        }

        [HttpPut]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.HierarchyManagement)]
        public ActionResult Update(int id, Models.Level level)
        {
            try
            {
                var updatedLevel = warrantyRepository.Save(new WarrantyLevel { Id = id, Name = level.Name });
                return Json(new Models.Level(updatedLevel));
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Level = level, Message = message });
            }
        }

        [HttpDelete]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.HierarchyManagement)]
        public ActionResult Delete(int id)
        {
            var tmpTaxType = merchandisingSettings.TaxInclusive ? "I" : "E";
            var taxSettings = new CosacsTaxSettings() { TaxRate = GetCountryTaxRate(), TaxType = tmpTaxType };

            var deletedWarranties = warrantyRepository.DeleteLevel(id);
            Blue.Cosacs.Warranty.Solr.SolrIndex.IndexWarranty(taxSettings,deletedWarranties.ToArray());
            return Json(new {});
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
