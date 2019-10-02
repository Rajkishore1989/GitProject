namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Mappers;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class RepossessedStockController : Controller
    {
        private readonly IProductRepository productRepository;
        private readonly IProductMapper productMapper;

        public RepossessedStockController(IProductRepository productRepository, IProductMapper productMapper)
        {
            this.productRepository = productRepository;
            this.productMapper = productMapper;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Detail(int id)
        {
            var product = productRepository.Get(id);
            if (product.ProductType != ProductTypes.RepossessedStock)
            {
                return RedirectToAction("Detail", product.ProductType, new { id = product.Id });
            }

            return View(productMapper.CreateRepossessedViewModel(product));
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedStockEdit)]
        [HttpPut]
        public ActionResult Update(int id)
        {
            return new JSendResult(JSendStatus.Success, productRepository.CreateRepossessedProducts(id, Request.RequestContext.HttpContext.GetUser().Id));
        }

        [HttpPost]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedStockEdit)]
        public JSendResult SaveHierarchySetting(int id, string level, string tag)
        {
            this.productRepository.SaveHierarchySetting(id, level, tag);
            return new JSendResult(JSendStatus.Success);
        }
    }
}
