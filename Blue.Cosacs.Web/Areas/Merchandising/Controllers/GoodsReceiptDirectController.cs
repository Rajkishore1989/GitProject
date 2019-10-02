namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class GoodsReceiptDirectController : Controller
    {
        private readonly IGoodsReceiptDirectRepository receiptRepository;
        private readonly IGoodsReceiptSolrIndexer goodsReceiptSolrIndexer;

        public GoodsReceiptDirectController(IGoodsReceiptDirectRepository receiptRepository, IGoodsReceiptSolrIndexer goodsReceiptSolrIndexer)
        {
            this.receiptRepository = receiptRepository;
            this.goodsReceiptSolrIndexer = goodsReceiptSolrIndexer;
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public ActionResult New()
        {
            return View("Detail", new GoodsReceiptDirectViewModel());
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Detail(int id)
        {
            var model = receiptRepository.Get(id);

            return View("Detail", model);
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

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public JSendResult Get(int id)
        {
            return new JSendResult(JSendStatus.Success, receiptRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Update(int id, List<StringKeyValue> referenceNumbers, string comments)
        {
            receiptRepository.Update(id, referenceNumbers, comments);
            ForceIndex(new[] { id });
            return new JSendResult(JSendStatus.Success);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Create(GoodsReceiptDirectCreateModel model)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    var receipt = receiptRepository.Create(model, HttpContext.GetUser());
                    ForceIndex(new[] { receipt.Id });
                    return new JSendResult(JSendStatus.Success, receipt);
                }
                catch (InvalidProductException ex)
                {
                    return new JSendResult(JSendStatus.Error, ex.Message);
                }
            }

            return new JSendResult(JSendStatus.BadRequest, message: string.Join(",",ModelState.GetErrors()));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptApprove)]
        public JSendResult Approve(int id, string comments)
        {
            var user = HttpContext.GetUser();
            receiptRepository.Approve(id, user.Id, comments);
            ForceIndex(new[] { id });
            return new JSendResult(JSendStatus.Success, new { user.Id, Name = user.FullName, DateApproved = DateTime.UtcNow });
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] ids = null)
        {
            this.goodsReceiptSolrIndexer.Index(ids);
        }
    }
}
