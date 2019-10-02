namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Linq;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Event;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Mappers;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Config.Repositories;

    public class SetController : Controller
    {
        private readonly ISetRepository setRepository;
        private readonly IProductMapper productMapper;
        private readonly ILog log;
        private readonly ISettings settings;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public SetController(ISetRepository setRepository, IProductMapper productMapper, ILog log, ISettings settings, IStockSolrIndexer stockSolrIndexer)
        {
            this.setRepository = setRepository;
            this.productMapper = productMapper;
            this.log = log;
            this.settings = settings;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public ViewResult New()
        {
            var viewmodel = productMapper.CreateSetViewModel(new SetModel());
            return View("Detail", viewmodel);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsView)]
        public ViewResult Detail(int id)
        {
            var viewmodel = productMapper.CreateSetViewModel(setRepository.Get(id));
            return View(viewmodel);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JsonResult Create(SetModel model)
        {
            if (!ModelState.IsValid)
            {
                var err = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return new JSendResult(JSendStatus.BadRequest, new { err });
            }

            model.Sku = GenerateSku();
            var set = Save(model);

            return new JSendResult(JSendStatus.Success, new { set });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JsonResult Update(SetModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, new { set = model });
            }

            var set = Save(model);

            try
            {
                ForceIndex(new[] { set.Id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }

            return new JSendResult(JSendStatus.Success, new { set });
        }

        private SetModel Save(SetModel model)
        {
            var set = this.setRepository.Save(model, Request.RequestContext.HttpContext.GetUser().Id);

            try
            {
                ForceIndex(new[] { set.Id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }
            return set;
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] productIds = null)
        {
            this.stockSolrIndexer.Index(productIds);
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JSendResult Location(int id, DateTime effectiveDate, string fascia, int? locationId, decimal? regularPrice, decimal? dutyFreePrice, decimal? cashPrice)
        {
            var viewmodel = productMapper.CreateSetViewModel(setRepository.SaveLocation(id, effectiveDate, fascia, locationId, regularPrice, dutyFreePrice, cashPrice, Request.RequestContext.HttpContext.GetUser().Id));
            if (viewmodel.Set.Locations.Any(l => l.LocationId == locationId || l.Fascia == fascia))
            {
                try
                {
                    ForceIndex(new[] { id });
                }
                catch (Exception e)
                {
                    log.Exception(new IndexingException(EventCategories.Merchandising, e));
                }

                return new JSendResult(JSendStatus.Success, viewmodel);
            }

            return new JSendResult(JSendStatus.BadRequest, null, "Missing price details for these products in this location. Please review retail prices for these products.");
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JSendResult Component(int setId, int id, string sku, int quantity)
        {
            var viewmodel = productMapper.CreateSetViewModel(setRepository.SaveComponent(setId, id, sku, quantity, Request.RequestContext.HttpContext.GetUser().Id));

            try
            {
                ForceIndex(new[] { setId });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }
            
            return new JSendResult(JSendStatus.Success, viewmodel);
        }

        [HttpDelete, ActionName("Location")]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JSendResult RemoveLocation(int id, DateTime effectiveDate, string fascia, int? locationId)
        {
            var viewmodel = productMapper.CreateSetViewModel(setRepository.RemoveLocation(id, effectiveDate, fascia, locationId, Request.RequestContext.HttpContext.GetUser().Id));

            try
            {
                ForceIndex(new[] { id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }
            
            return new JSendResult(JSendStatus.Success, viewmodel);
        }

        [HttpDelete]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SetsEdit)]
        public JSendResult Component(int id, string sku)
        {
            var viewmodel = productMapper.CreateSetViewModel(setRepository.RemoveComponent(id, sku, Request.RequestContext.HttpContext.GetUser().Id));

            try
            {
                ForceIndex(new[] { id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }

            return new JSendResult(JSendStatus.Success, viewmodel);
        }

        private string GenerateSku()
        {
            var country = settings.Get("countrycode").Trim();
            var id = HiLo.Cache("Merchandising.Set").NextId();
            if (id > 9999)
            {
                throw new OverflowException("No more Set SKUs are available");
            }
            return string.Format("KIT{0}{1}", country, id.ToString().PadLeft(4, '0'));
        }
    }
}
