using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Merchandising.Solr;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Web.Helpers;
using Blue.Glaucous.Client.Mvc;
using Microsoft.Practices.ObjectBuilder2;
using System;
using System.Linq;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class TaxController : Controller
    {
        private readonly ITaxRepository taxRepository;
        private readonly IStockSolrIndexer stockSolrIndexer;
        private readonly Settings settings;

        public TaxController(ITaxRepository taxRepository, Settings settings, IStockSolrIndexer stockSolrIndexer)
        {
            this.taxRepository = taxRepository;
            this.settings = settings;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        [Permission(MerchandisingPermissionEnum.TaxRateView)]
        public ActionResult Index()
        {
            return View(taxRepository.Get());
        }

        [Permission(MerchandisingPermissionEnum.TaxRateEdit)]
        public JsonResult Create(TaxRateModel model)
        {
            return Save(model);
        }

        [Permission(MerchandisingPermissionEnum.TaxRateEdit)]
        public JsonResult Update(TaxRateModel model)
        {
            return Save(model);
        }

        public JSendResult GetCurrent()
        {
            var tax = taxRepository.GetCurrent();
            return new JSendResult(JSendStatus.Success, new { CurrentTaxRate = tax == null ? 0 : tax.Rate });
        }

        public JSendResult GetAllSystem()
        {
            return new JSendResult(JSendStatus.Success, taxRepository.GetAllSystem());
        }

        public JSendResult GetTaxSettings()
        {
            var taxRate = taxRepository.GetCurrent();
            // Needed to change the name and don't have time to see what breaks. Hence duplicate.
            return new JSendResult(JSendStatus.Success, new { TaxSetting = settings.TaxInclusive, IsTaxInclusive = settings.TaxInclusive, CurrentTaxRate = taxRate == null ? 0 : taxRate.Rate });
        }

        [Permission(MerchandisingPermissionEnum.TaxRateEdit)]
        public JSendResult Delete(int id)
        {
            try
            {
                var rate = taxRepository.Get(id);
                if (rate.EffectiveDate.Date >= DateTime.Now.Date)
                {
                    this.taxRepository.Delete(id);
                }
                else
                {
                    return new JSendResult(JSendStatus.BadRequest, message: "Cannot delete current or past tax rates.");
                }
            }
            catch (Exception)
            {
                return new JSendResult(JSendStatus.Error, message: "Unable to delete tax rate. An error occurred on the server.");
            }
            return new JSendResult(JSendStatus.Success);
        }

        private JSendResult Save(TaxRateModel model)
        {
            if (taxRepository.GetAll().Any(t => t.ProductId == model.ProductId && t.EffectiveDate.Date == model.EffectiveDate.Date))
            {
                ModelState.AddModelError("EffectiveDate", @"A tax rate for this date already exists");
            }

            if (ModelState.IsValid)
            {
                var result = taxRepository.Save(model);
                if (model.ProductId.HasValue)
                {
                    this.stockSolrIndexer.Index(new int[] { model.ProductId.Value });
                }
                return new JSendResult(JSendStatus.Success, result);
            }
            return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","), data: new { supplier = model });
        }
    }
}
