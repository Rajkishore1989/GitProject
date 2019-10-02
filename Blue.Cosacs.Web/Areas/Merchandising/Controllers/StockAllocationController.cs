namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockAllocationController : Controller
    {
        private readonly IStockAllocationRepository stockAllocationRepository;

        public StockAllocationController(IStockAllocationRepository stockAllocationRepository)
        {
            this.stockAllocationRepository = stockAllocationRepository;
        }

        [Permission(MerchandisingPermissionEnum.StockAllocationView)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.StockAllocationView)]
        public ViewResult New()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.StockAllocationEdit)]
        public JSendResult Create(StockAllocationCreateModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }

            var hilo = HiLo.Cache("warehouse.booking");

            var result = stockAllocationRepository.Create(model, HttpContext.GetUser().Id, hilo.NextId);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(MerchandisingPermissionEnum.StockAllocationView)]
        public JsonResult Search(StockAllocationQueryModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = stockAllocationRepository.Search(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }

        public JsonResult GetStockInfo(int productId, int warehouseLocationId)
        {
            var stockInfo = stockAllocationRepository.GetStockInfo(productId, warehouseLocationId);
            return new JSendResult(JSendStatus.Success, stockInfo);
        }
    }
}
