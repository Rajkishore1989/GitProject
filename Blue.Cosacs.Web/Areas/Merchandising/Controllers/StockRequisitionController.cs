namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockRequisitionController : Controller
    {
        private readonly IStockRequisitionRepository stockRequisitionRepository;

        public StockRequisitionController(IStockRequisitionRepository stockRequisitionRepository)
        {
            this.stockRequisitionRepository = stockRequisitionRepository;
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public ViewResult New()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public ViewResult OnOrder(int productId, int locationId)
        {
            return View("OnOrder", stockRequisitionRepository.GetOnOrder(productId, locationId));
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public ViewResult GetPendingQuantity(int productId, int locationId)
        {
            return View("OnOrder", stockRequisitionRepository.GetPendingPurchaseQuantity(productId, locationId));
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionEdit)]
        public JSendResult Create(StockRequisitionCreateModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }

            var hilo = HiLo.Cache("warehouse.booking");
            var result = stockRequisitionRepository.Create(model, HttpContext.GetUser().Id, hilo.NextId);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public JSendResult StockInfo(int productId, int receivingLocationId, int warehouseLocationId)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
           
            var result = stockRequisitionRepository.GetStockInfo(productId, receivingLocationId, warehouseLocationId);

            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(MerchandisingPermissionEnum.StockRequisitionView)]
        public JsonResult Search(StockRequisitionQueryModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = stockRequisitionRepository.Search(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }
    }
}
