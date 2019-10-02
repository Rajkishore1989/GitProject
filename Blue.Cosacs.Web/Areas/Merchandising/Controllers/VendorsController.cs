namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Web;
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Event;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Microsoft.Practices.ObjectBuilder2;

    public class VendorsController : Controller
    {
        private readonly ISupplierRepository supplierRepository;

        private readonly ILog log;
        private readonly IVendorSolrIndexer vendorSolrIndexer;

        public VendorsController(ISupplierRepository supplierRepository, ILog log, IVendorSolrIndexer vendorSolrIndexer)
        {
            this.supplierRepository = supplierRepository;
            this.log = log;
            this.vendorSolrIndexer = vendorSolrIndexer;
        }

        public ActionResult Ref(string code)
        {
            var vendor = supplierRepository.LocateResource(code);
            if (vendor == null || vendor.Id == 0)
            {
                throw new HttpException((int)HttpStatusCode.NotFound, "Resource Not Found");
            }
            return RedirectToAction("Detail", new { id = vendor.Id });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorView)]
        public ActionResult Get(int? id = null)
        {
            if (id == null)
            {
                return new JSendResult(JSendStatus.Success, supplierRepository.Get());
            }
            return new JSendResult(JSendStatus.Success, supplierRepository.Get(id.Value));
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorView)]
        public ActionResult GetList()
        {
            return new JSendResult(JSendStatus.Success, supplierRepository.GetList());
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorEdit)]
        public ActionResult New()
         {
             return View(
                 "Detail",
                 new SupplierViewModel()
                     {
                        Supplier = new SupplierModel { Tags = new List<string>() },
                    Statuses = GetStatuses()
                    });
        }

        private List<SupplierStatus> GetStatuses()
        {
            return new List<SupplierStatus> 
            {
                new SupplierStatus 
                {
                    Id = (int)SupplierStatusEnum.Active,
                    Name = SupplierStatusEnum.Active.ToString(),
                },
                new SupplierStatus 
                {
                    Id = (int)SupplierStatusEnum.Inactive,
                    Name = SupplierStatusEnum.Inactive.ToString(),
                }
            };
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorView)]
        public ActionResult Detail(int id)
        {
            return View(
                new SupplierViewModel()
                    {
                        Supplier = supplierRepository.Get(id, true),
                        Statuses = GetStatuses()
                    });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorEdit)]
        public JsonResult Create(SupplierModel model)
        {
            if (supplierRepository.Exists(model.Code))
            {
                ModelState.AddModelError("Name", "A vendor with this code already exists");
            }

            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","),data: new { supplier = model });
            }

            var supplier = Save(model);

            return new JSendResult(JSendStatus.Success, new { supplier });
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorEdit)]
        public JsonResult Update(SupplierModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","), data:new { supplier = model });
            }

            var supplier = Save(model);

            return new JSendResult(JSendStatus.Success, new { supplier });
        }

        private SupplierModel Save(SupplierModel model)
        {
            var supplier = supplierRepository.Save(model);

            try
            {
                ForceIndex(new[] { supplier.Id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }
            return supplier;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Index(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.VendorEdit)]
        public JSendResult Tags(int id, List<string> vendorTags)
        {
            var supplier = supplierRepository.Get(id);
            if (supplier.Id != null)
            {
                supplierRepository.SaveSupplierTags(id, vendorTags);
                var ids = new[] { Convert.ToInt32(supplier.Id) };
                ForceIndex(ids);
                return new JSendResult(JSendStatus.Success);
            }
            return new JSendResult(JSendStatus.BadRequest, message: "Supplier doesn't exist");
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "MerchandiseVendor")
        {
            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: new[] { "VendorType", "Status", "Tags" },
                showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] vendorIds = null)
        {
            this.vendorSolrIndexer.Index(vendorIds);
        }
    }
}
