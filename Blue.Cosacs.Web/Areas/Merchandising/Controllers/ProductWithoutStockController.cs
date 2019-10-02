namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Mappers;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Glaucous.Client.Mvc;

    public class ProductWithoutStockController : Controller
    {
        private readonly IProductRepository productRepository;
        private readonly IProductMapper productMapper;

        public ProductWithoutStockController(IProductRepository productRepository, IProductMapper productMapper)
        {
            this.productRepository = productRepository;
            this.productMapper = productMapper;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ProductsWithoutStockEdit)]
        public ViewResult New()
        {
            var product = new Product { ProductType = ProductTypes.ProductWithoutStock };
            return View("Detail", productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser()));
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Detail(int id)
        {
            var product = productRepository.Get(id);
            if (product.ProductType != ProductTypes.ProductWithoutStock)
            {
                return RedirectToAction("Detail", product.ProductType, new { id = product.Id });
            }

            return View(productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser()));
        }
    }
}
