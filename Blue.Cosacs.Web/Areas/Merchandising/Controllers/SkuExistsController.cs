namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class SkuExistsController : Controller
    {
        private readonly IProductRepository repository;

        public SkuExistsController(IProductRepository repository)
        {
            this.repository = repository;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public JSendResult Get(string sku)
        {
            return new JSendResult(JSendStatus.Success, new { exists = repository.SkuExists(sku) });
        }
    }
}
