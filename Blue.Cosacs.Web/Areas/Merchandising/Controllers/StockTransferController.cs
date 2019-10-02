namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockTransferController : Controller
    {
        private readonly IStockTransferRepository stockTransferRepository;
        private readonly IStockSolrIndexer stockSolrRepo;

        public StockTransferController(IStockTransferRepository stockTransferRepository, IStockSolrIndexer stockSolrRepo)
        {
            this.stockTransferRepository = stockTransferRepository;
            this.stockSolrRepo = stockSolrRepo;
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public ViewResult New()
        {
            return View("Detail", new StockTransferViewModel());
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public ViewResult Detail(int id)
        {
            return View("Detail", stockTransferRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public ViewResult PrintTransferNote(int id)
        {
            return View(stockTransferRepository.PrintBase(id));
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public ViewResult PrintStockSheet(int id)
        {
            return View(stockTransferRepository.PrintBase(id));
        }

        [Permission(MerchandisingPermissionEnum.StockTransferEdit)]
        public JsonResult Create(StockTransferCreateModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }

            var hilo = HiLo.Cache("warehouse.booking");
            var result = stockTransferRepository.Create(model, HttpContext.GetUser().Id, hilo.NextId);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(MerchandisingPermissionEnum.StockTransferView)]
        public JsonResult Search(StockTransferQueryModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = stockTransferRepository.Search(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }
    }
}