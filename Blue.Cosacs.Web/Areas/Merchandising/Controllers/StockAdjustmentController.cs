namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockAdjustmentController : Controller
    {
        private readonly IStockAdjustmentRepository stockAdjustmentRepository;
        private readonly IStockSolrIndexer stockSolrRepo;

        public StockAdjustmentController(IStockAdjustmentRepository stockAdjustmentRepository, IStockSolrIndexer stockSolrRepo)
        {
            this.stockAdjustmentRepository = stockAdjustmentRepository;
            this.stockSolrRepo = stockSolrRepo;
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentEdit)]
        public ViewResult New()
        {
            return View("Detail", new StockAdjustmentViewModel());
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentView)]
        public ViewResult Detail(int id)
        {
            return View(stockAdjustmentRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentView)]
        public ActionResult Index()
        {
            var model = stockAdjustmentRepository.Search(new StockAdjustmentSearchQueryModel(), 10, 0);
            return View("Index", model);
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentView)]
        public ActionResult Search(StockAdjustmentSearchQueryModel param, int pageSize, int pageIndex)
        {
            var model = stockAdjustmentRepository.Search(param, pageSize, pageIndex > 0 ? pageIndex - 1 : 0);
            return new JSendResult(JSendStatus.Success, model);
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentView)]
        public ViewResult Print(int id)
        {
            return View(stockAdjustmentRepository.Print(id));
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentEdit)]
        public JsonResult Create(StockAdjustmentCreateModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            try
            {
                var result = stockAdjustmentRepository.Create(model, HttpContext.GetUser().Id);
                return new JSendResult(JSendStatus.Success, result);
            }
            catch (InvalidProductException ex)
            {
                return new JSendResult(JSendStatus.Error, message: ex.Message);
            }
        }

        [Permission(MerchandisingPermissionEnum.StockAdjustmentAuthorise)]
        public JsonResult Approve(int id, string comments)
        {
            var result = stockAdjustmentRepository.Approve(id, comments, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success, result);
        }
    }
}