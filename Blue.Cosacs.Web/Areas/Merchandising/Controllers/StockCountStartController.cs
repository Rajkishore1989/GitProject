namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using System.Net.Http;
    using System.Net;

    public class StockCountStartController : Controller
    {
        private readonly IStockCountRepository stockCountRepository;

        public StockCountStartController(IStockCountRepository stockCountRepository)
        {
            this.stockCountRepository = stockCountRepository;
        }
       
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountStart)]
        public ViewResult Start(int id)
        {
            return View(id);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountStart)]
        public JsonResult Create(int model)
        {
            stockCountRepository.CreateStockProducts(model, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success);
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountStart)]
        public JsonResult Get(int id)
        {
            var result = stockCountRepository.GetStockCountStart(id);
            return new JSendResult(JSendStatus.Success, result);
        }
    }
}