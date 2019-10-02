namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Net;
    using System.Text;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Event;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Messages.Merchandising.PurchaseOrder;
    using Blue.Cosacs.Web.Common;
    using Blue.Solr;
    using Blue.Hub.Client;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class PurchaseController : Controller
    {
        private readonly IPurchaseRepository purchaseRepository;
        private readonly ILog log;
        private readonly IPurchaseOrderSolrIndexer purchaseOrderSolrIndexer;

        private readonly Settings settings;

        private readonly IPublisher publisher;
        private readonly ISupplierRepository supplierRepository;

        public PurchaseController(IPurchaseRepository purchaseRepository, ISupplierRepository supplierRepository, IPublisher publisher, ILog log, IPurchaseOrderSolrIndexer purchaseOrderSolrIndexer, Settings settings)
        {
            this.supplierRepository = supplierRepository;
            this.purchaseRepository = purchaseRepository;
            this.publisher = publisher;
            this.log = log;
            this.purchaseOrderSolrIndexer = purchaseOrderSolrIndexer;
            this.settings = settings;
            this.supplierRepository = supplierRepository;
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderEdit)]
        public ActionResult New()
        {
            return View("Detail", new PurchaseOrderCreateModel());
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult Detail(int id)
        {
            return View("Detail", purchaseRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult Print(int id)
        {
            var model = purchaseRepository.GetForPrint(id);
            purchaseRepository.UpdatePrint(id, false);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult PrintWithCost(int id)
        {
            var model = purchaseRepository.GetForPrint(id);
            purchaseRepository.UpdatePrint(id, true);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult PrintAlternate(int id)
        {
            var model = purchaseRepository.GetForPrint(id);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public JSendResult Get(int id)
        {
            return new JSendResult(JSendStatus.Success, purchaseRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult GetForReceipt(int id)
        {
            return new JSendResult(JSendStatus.Success, purchaseRepository.GetForReceipt(id));
        }
       
        [Permission(MerchandisingPermissionEnum.PurchaseOrderEdit)]
        public JSendResult Create(PurchaseOrderCreateModel model)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    var user = this.GetUser();
                    model.CreatedById = user.Id;
                    model.CreatedBy = user.FullName;
                    var purchaseOrder = purchaseRepository.Create(model);

                    try
                    {
                        ForceIndex(new[] { purchaseOrder.Id });
                    }
                    catch (Exception e)
                    {
                        log.Exception(new IndexingException(EventCategories.Merchandising, e));
                    }
                    return new JSendResult(JSendStatus.Success, purchaseOrder);                 
                }
                catch (Exception e)
                {
                    log.Exception(new IndexingException(EventCategories.Merchandising, e));
                    return new JSendResult(JSendStatus.Error, message: "There was a problem saving the purchase order.");
                }
            }

            return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
        }
        
        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult Email(int id)
        {
            var purchaseOrder = purchaseRepository.Get(id);
            // Load vendor and try to send email
            var vendor = supplierRepository.Get(purchaseOrder.VendorId);
            if (vendor != null)
            {
                if (vendor.OrderEmail != null)
                {
                    publisher.Publish<Context, VendorPurchaseOrder>(
                        "Merchandising.VendorMail",
                        new VendorPurchaseOrder()
                            {
                                VendorId = vendor.Id,
                                PurchaseOrderId = purchaseOrder.Id,
                                VendorEmail = vendor.OrderEmail,
                                VendorName = vendor.Name
                            });
                           
                    return new JSendResult(JSendStatus.Success, purchaseOrder);
                }
                return new JSendResult(JSendStatus.BadRequest, message: "No Vendor Email Found");
            }
            return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderEdit)]
        public JSendResult Cancel(int id)
        {
            purchaseRepository.Cancel(id);

            try
            {
                ForceIndex(new[] { id });
            }
            catch (Exception e)
            {
                log.Exception(new IndexingException(EventCategories.Merchandising, e));
            }

            return new JSendResult(JSendStatus.Success);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderEdit)]
        public JSendResult CancelProduct(int id, int purchaseOrderProductId)
        {
            var user = HttpContext.GetUser();
            return new JSendResult(JSendStatus.Success, purchaseRepository.CancelProduct(id, user, purchaseOrderProductId));
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderEdit)]
        public JSendResult Update(EditPurchaseOrderViewModel model)
        {
            if (ModelState.IsValid)
            {
                purchaseRepository.Update(model);
                try
                {
                    ForceIndex(new[] { model.Id });
                }
                catch (Exception e)
                {
                    log.Exception(new IndexingException(EventCategories.Merchandising, e));
                }
                return new JSendResult(JSendStatus.Success, purchaseRepository.Get(model.Id));
            }
            return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
        }

        [HttpGet]
        [CronJob]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        [LongRunningQueries]
        public HttpStatusCodeResult AutoExpire()
        {
            purchaseRepository.AutoExpire();
            return new HttpStatusCodeResult((int)HttpStatusCode.OK);
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public ActionResult Index(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] ids = null)
        {
            this.purchaseOrderSolrIndexer.Index(ids);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public JSendResult NotReceived(int vendorId)
        {
            return new JSendResult(JSendStatus.Success, purchaseRepository.GetNotReceived(vendorId));
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        [Permission(MerchandisingPermissionEnum.PurchaseOrderView)]
        public JSendResult Labels(List<PurchaseOrderProductLabelModel> products)
        {
            var model = purchaseRepository.GetPrintLabels(products);
            var labels = RenderRazorViewToString("StockLabelPrint", model);

            return new JSendResult(JSendStatus.Success, new { data = labels, printer = settings.ZebraPrinterName });
        }

        private string RenderRazorViewToString(string viewName, object model)
        {
            ViewData.Model = model;
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(ControllerContext, viewName);
                var viewContext = new ViewContext(ControllerContext, viewResult.View, ViewData, TempData, sw);
                viewResult.View.Render(viewContext, sw);
                var result = sw.GetStringBuilder().ToString();
                return result;
            }
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "MerchandisePurchaseOrder")
        {
            var result = new Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: new[] { "Vendor", "ReceivingLocation", "Status", "OriginSystem" },
                showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }
    }
}
