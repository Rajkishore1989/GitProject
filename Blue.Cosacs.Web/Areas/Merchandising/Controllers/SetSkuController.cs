namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class SetSkuController : Controller
    {
        private readonly ISetRepository repository;

        public SetSkuController(ISetRepository repository)
        {
            this.repository = repository;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public JSendResult Get(string sku)
        {
            return new JSendResult(JSendStatus.Success, repository.LookupSetProduct(sku));
        }
    }
}
