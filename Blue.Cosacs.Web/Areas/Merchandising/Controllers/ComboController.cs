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
    using Blue.Glaucous.Client.Api;
    using PermissionAttribute = Glaucous.Client.Mvc.PermissionAttribute;
    using LongRunningQueriesAttribute = Glaucous.Client.Mvc.LongRunningQueriesAttribute;

    public class ComboController : Controller
    {
        private readonly IComboRepository comboRepository;
        private readonly IProductMapper productMapper;
        private readonly ILog log;
        private readonly IStockSolrIndexer stockSolrIndexer;
        private readonly ISettings settings;

        public ComboController(IComboRepository comboRepository, IProductMapper productMapper, ILog log, IStockSolrIndexer stockSolrIndexer, ISettings settings)
        {
            this.comboRepository = comboRepository;
            this.productMapper = productMapper;
            this.log = log;
            this.stockSolrIndexer = stockSolrIndexer;
            this.settings = settings;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public ViewResult New()
        {
            var viewmodel = productMapper.CreateComboViewModel(new ComboModel());
            return View("Detail", viewmodel);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboView)]
        public ViewResult Detail(int id)
        {
            var viewmodel = productMapper.CreateComboViewModel(comboRepository.Get(id));
            return View(viewmodel);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JsonResult Create(ComboModel model)
        {
            if (!ModelState.IsValid)
            {
                var err = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return new JSendResult(JSendStatus.BadRequest, new { err });
            }

            model.SKU = GenerateSku();

            var combo = Save(model);
            ForceIndex(new[] { combo.Id });

            return new JSendResult(JSendStatus.Success, new { combo });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JsonResult Update(ComboModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, new { combo = model });
            }

            var combo = Save(model);

            try
            {
                ForceIndex(new[] { combo.Id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }

            return new JSendResult(JSendStatus.Success, new { combo });
        }

        private ComboModel Save(ComboModel model)
        {
            if (model.EndDate.Value.Date < model.StartDate.Value.Date)
            {
                ModelState.AddModelError("EndDate", "End date must be on or after start date");
            }
            //Change for ZEN/UNC/CRF/CR2018-011 Pricing Promotion - Happy Hour
            if (model.EndDate.Value.TimeOfDay < model.StartDate.Value.TimeOfDay)
            {
                ModelState.AddModelError("EndDate", "End Time must be on or after Start Time");
            }

           

            var  combo = new ComboModel();
            if (ModelState.IsValid)
            {
                combo = this.comboRepository.Save(model, Request.RequestContext.HttpContext.GetUser().Id);
                try
                {
                    ForceIndex(new[] { combo.Id });
                }
                catch (Exception e)
                {
                    log.Exception(new IndexingException(EventCategories.Merchandising, e));
                }
                
            }

            return combo;
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] productIds = null)
        {
            this.stockSolrIndexer.Index(productIds);
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JSendResult Location(int id, string fascia, int? locationId, ComboProductPriceModel locationPrices)
        {
            var viewmodel = productMapper.CreateComboViewModel(comboRepository.SaveLocation(id, fascia, locationId, locationPrices, Request.RequestContext.HttpContext.GetUser().Id));
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

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JSendResult Component(int id, int setProductId, string sku, int quantity)
        {
            var viewmodel = productMapper.CreateComboViewModel(comboRepository.SaveComponent(id, setProductId, sku, quantity, Request.RequestContext.HttpContext.GetUser().Id));

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

        [HttpDelete, ActionName("Location")]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JSendResult RemoveLocation(int id, string fascia, int? locationId)
        {
            var viewmodel = productMapper.CreateComboViewModel(comboRepository.RemoveLocation(id, fascia, locationId, Request.RequestContext.HttpContext.GetUser().Id));

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
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ComboEdit)]
        public JSendResult Component(int id, string sku)
        {
            var viewmodel = productMapper.CreateComboViewModel(comboRepository.RemoveComponent(id, sku, Request.RequestContext.HttpContext.GetUser().Id));

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
            var id = HiLo.Cache("Merchandising.Combo").NextId();
            if (id > 9999)
            {
                throw new OverflowException("No more Combo SKUs are available");
            }
            return string.Format("COM{0}{1}", country, id.ToString().PadLeft(4, '0'));
        }
    }
}
