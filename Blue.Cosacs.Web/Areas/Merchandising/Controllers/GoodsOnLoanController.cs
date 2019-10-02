namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class GoodsOnLoanController : Controller
    {
        private readonly IGoodsOnLoanRepository goodsOnLoanRepository;
        private readonly IStockSolrIndexer stockSolrRepo;
        private readonly IServiceRequestRepository serviceRequestRepo;

        private readonly Settings merchandiseSettings;

        public GoodsOnLoanController(IGoodsOnLoanRepository goodsOnLoanRepository, IStockSolrIndexer stockSolrRepo, IServiceRequestRepository serviceRequestRepo, Settings merchandiseSettings)
        {
            this.goodsOnLoanRepository = goodsOnLoanRepository;
            this.stockSolrRepo = stockSolrRepo;
            this.serviceRequestRepo = serviceRequestRepo;
            this.merchandiseSettings = merchandiseSettings;
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public ViewResult New()
        {
            return View("Detail", new GoodsOnLoanViewModel());
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public ViewResult Detail(int id)
        {
            return View("Detail", this.goodsOnLoanRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanEdit)]
        public JSendResult Create(GoodsOnLoanCreateModel model)
        {
            if (string.IsNullOrWhiteSpace(merchandiseSettings.GoodsOnLoanWarehouse))
            {
                ModelState.AddModelError(string.Empty,"Goods on loan warehouse must be configured.");
            }

            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }

            var hilo = HiLo.Cache("warehouse.booking");
            var result = this.goodsOnLoanRepository.Create(model, HttpContext.GetUser().Id, hilo.NextId);
            return new JSendResult(JSendStatus.Success, result);
        }

         [Permission(MerchandisingPermissionEnum.GoodsOnLoanEdit)]
        public JSendResult Update(GoodsOnLoanUpdateModel model)
        {
            if (string.IsNullOrWhiteSpace(merchandiseSettings.GoodsOnLoanWarehouse))
            {
                ModelState.AddModelError(string.Empty, "Goods on loan warehouse must be configured.");
            }

            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }

            var result = this.goodsOnLoanRepository.Update(model);
            return new JSendResult(JSendStatus.Success, result);
        }

        public JSendResult Collect(int id)
        {
            var hilo = HiLo.Cache("warehouse.booking");
            var result = this.goodsOnLoanRepository.Collect(id, HttpContext.GetUser().Id, hilo.NextId);

            return new JSendResult(JSendStatus.Success,result);
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public JsonResult Search(GoodsOnLoanQueryModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = this.goodsOnLoanRepository.Search(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }

        public JsonResult GetStockInfo(int productId, int warehouseLocationId)
        {
            var stockInfo = this.goodsOnLoanRepository.GetStockInfo(productId, warehouseLocationId);
            return new JSendResult(JSendStatus.Success, stockInfo);
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SearchServiceRequests(string q)
        {
            var results = this.serviceRequestRepo.GetServiceRequestDetails(q);
            return new JSendResult(JSendStatus.Success, results);
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public ViewResult PrintDeliveryNote(int id)
        {
            return View(goodsOnLoanRepository.Print(id, GoodsOnLoanPrintType.Delivery));
        }

        [Permission(MerchandisingPermissionEnum.GoodsOnLoanView)]
        public ViewResult PrintCollectionNote(int id)
        {
            return View(goodsOnLoanRepository.Print(id,GoodsOnLoanPrintType.Collection));
        }
    }
}
