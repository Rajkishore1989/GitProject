namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class StockCountPreviousController : Controller
    {
        private readonly IStockCountRepository stockCountRepository;
        private readonly IProductRepository productRepository;

        public StockCountPreviousController(IStockCountRepository stockCountRepository, IProductRepository productRepository)
        {
            this.stockCountRepository = stockCountRepository;
            this.productRepository = productRepository;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountView)]
        public ViewResult Detail(int id)
        {
            return View(productRepository.GetDescriptor(id));
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountView)]
        public ActionResult Search(int id, int pageSize, int pageNumber)
        {
            var pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = stockCountRepository.GetPrevious(id, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }
    }
}