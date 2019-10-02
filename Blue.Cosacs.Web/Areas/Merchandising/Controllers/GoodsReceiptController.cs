namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web.Mvc;
    using Settings = Blue.Cosacs.Merchandising.Settings;

    public class GoodsReceiptController : Controller
    {
        private readonly IGoodsReceiptRepository receiptRepository;

        private readonly IGoodsReceiptDirectRepository goodsReceiptDirectRepository;

        private readonly Settings settings;
        private readonly IGoodsReceiptSolrIndexer goodsReceiptSolrIndexer;

        public GoodsReceiptController(IGoodsReceiptRepository receiptRepository, IGoodsReceiptDirectRepository goodsReceiptDirectRepository, Settings settings, IGoodsReceiptSolrIndexer goodsReceiptSolrIndexer)
        {
            this.receiptRepository = receiptRepository;
            this.goodsReceiptDirectRepository = goodsReceiptDirectRepository;
            this.settings = settings;
            this.goodsReceiptSolrIndexer = goodsReceiptSolrIndexer;
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public ActionResult New()
        {
            return View("Detail", new GoodsReceiptViewModel { EnableBackOrderCancel = settings.BackOrders });
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Detail(int id)
        {
            var model = receiptRepository.Get(id);
            model.EnableBackOrderCancel = settings.BackOrders;

            return View("Detail", model);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult BatchPrint(string goodsReceiptIds, string directReceiptIds, bool includeCosts)
        {
            var parsedGoodReceiptIds = new List<int>();
            if (!string.IsNullOrWhiteSpace(goodsReceiptIds))
            {
                parsedGoodReceiptIds = goodsReceiptIds.Split(',').Select(int.Parse).ToList();
            }

            var parsedDirectReceiptIds = new List<int>();

            if (!string.IsNullOrWhiteSpace(directReceiptIds))
            {
                parsedDirectReceiptIds = directReceiptIds.Split(',').Select(int.Parse).ToList();
            }

            var goodsReceipts = receiptRepository.BulkPrint(parsedGoodReceiptIds, includeCosts);
            var directReceipts = goodsReceiptDirectRepository.BulkPrint(parsedDirectReceiptIds, includeCosts);

            return View(new GoodsReceiptBulkPrintModel { GoodsReceiptDirectPrintModels = directReceipts, GoodsReceiptPrintModels = goodsReceipts, IncludeCosts = includeCosts });
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Print(int id)
        {
            return View(receiptRepository.Print(id, false));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult PrintWithCost(int id)
        {
            return View(receiptRepository.Print(id, true));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptVerify)]
        public ActionResult VerifyCost(int id)
        {
            return View(receiptRepository.GetCosts(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptVerify)]
        public JSendResult ConfirmCost(int id)
        {
            var user = HttpContext.GetUser();
            receiptRepository.ConfirmCosts(id, user.Id);
            ForceIndex(new[] { id });
            return new JSendResult(JSendStatus.Success, new { user.Id, Name = user.FullName, DateApproved = DateTime.UtcNow });
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public JSendResult Get(int id)
        {
            return new JSendResult(JSendStatus.Success, receiptRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Comments(int id, string comments)
        {
            receiptRepository.UpdateComments(id, comments);
            ForceIndex(new[] { id });
            return new JSendResult(JSendStatus.Success);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Create(GoodsReceiptCreateModel model)
        {
            if (ModelState.IsValid)
            {
                var user = HttpContext.GetUser();
                try
                {
                    Func<int, string, string> productUrl = (id, sku) =>
                    {
                        return string.Format("{0} - {1}", sku, Url.Action("Detail", "RegularStock", new { id }, Request.Url.Scheme) + "?scrollTo=CostPricing");
                    };

                    using (var scope = Context.Write())
                    {
                        var receipt = receiptRepository.Create(model, user,
                                                              (id) => Url.Action("VerifyCost", "GoodsReceipt", new { id }, Request.Url.Scheme),
                                                              productUrl
                                                              );
                        ForceIndex(new[] { receipt.Id });
                        receipt.EnableBackOrderCancel = settings.BackOrders;

                        scope.Context.SaveChanges();
                        scope.Complete();
                        return new JSendResult(JSendStatus.Success, receipt);
                    }

                }
                catch (InvalidProductException ex)
                {
                    return new JSendResult(JSendStatus.Error, ex.Message);
                }
            }

            return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptApprove)]
        public JSendResult Approve(int id, string comments)
        {
            var user = HttpContext.GetUser();
            receiptRepository.Approve(id, user.Id, comments);
            ForceIndex(new[] { id });
            return new JSendResult(JSendStatus.Success, new { user.Id, Name = user.FullName, DateApproved = DateTime.UtcNow });
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Index(string q = "")
        {
            ViewBag.buttons = (new
            {
                BatchPrintWithCosts = new
                {
                    enabled = this.GetUser().HasPermission(MerchandisingPermissionEnum.GoodsReceiptView),
                    label = "Print With Costs"
                },
                BatchPrintWithOutCosts = new
                {
                    enabled = this.GetUser().HasPermission(MerchandisingPermissionEnum.GoodsReceiptView),
                    label = "Print Without Costs"
                },
            }).ToJson();

            return View(model: SearchSolr(q));
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] ids = null)
        {
            this.goodsReceiptSolrIndexer.Index(ids);
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "MerchandiseGoodsReceipt")
        {
            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: new[] { "ReceiptType", "Status", "Vendor", "ReceivingLocation", "ReceivedBy", "ApprovedBy" },
                showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }
    }
}
