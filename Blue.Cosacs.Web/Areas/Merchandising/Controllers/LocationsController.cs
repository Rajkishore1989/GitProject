namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Merchandising.Event;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Glaucous.Client.Mvc;

    public class LocationsController : Controller
    {
        private readonly ILocationRepository locationRepository;
        private readonly ILog log;
        private readonly ILocationSolrIndexer locationSolrIndexer;

        public LocationsController(ILocationRepository locationRepository, ILog log, ILocationSolrIndexer locationSolrIndexer)
        {
            this.locationRepository = locationRepository;
            this.log = log;
            this.locationSolrIndexer = locationSolrIndexer;
        }
        
        public ActionResult Ref(string locationId)
        {
            return RedirectToAction("Detail", new { id = this.locationRepository.LocateResource(locationId) });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationView)]
        public ActionResult Get(int? id = null)
        {
            if (id == null)
            {
                return new JSendResult(JSendStatus.Success, locationRepository.Get());
            }
            return new JSendResult(JSendStatus.Success, locationRepository.Get(id.Value));
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationView)]
        public ActionResult GetList(bool warehouseOnly)
        {
            return new JSendResult(JSendStatus.Success, locationRepository.GetDictionary(warehouseOnly));  
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationView)]
        public ActionResult Detail(int id)
        {
            return View("Detail", this.locationRepository.Get(id));
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationEdit)]
        public ActionResult New()
        {
            return View("Detail");
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationEdit)]
        public JsonResult Save(LocationModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, new { location = model });
            }

            if (this.locationRepository.IsLocationIdDuplicate(model))
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Cannot save location, Location Id must be unique.");
            }

            if (this.locationRepository.IsSalesIdDuplicate(model))
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Cannot save location, Sales System Id must be unique.");
            }

            var newLocation = this.locationRepository.Save(model);

            try
            {
                ForceIndex(new[] { newLocation.Id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }
            return new JSendResult(JSendStatus.Success, new { location = newLocation });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationView)]
        public ActionResult Index(string q = "")
        {
            ViewBag.title = "Search Locations";
            return View(model: SearchSolr(q));
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] locationIds = null)
        {
            this.locationSolrIndexer.Index(locationIds);
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.LocationView)]
        public void SearchInstant(string q, int start = 0, int rows = 25)
        {
            var result = SearchSolr(q, start, rows);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "location")
        {
            var query = new Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: new[] { "Fascia", "StoreType", "Warehouse", "Active", "VirtualWarehouse" },
                    showEmpty: false,
                    start: start,
                    rows: rows);
            return query;
        }
    }
}
