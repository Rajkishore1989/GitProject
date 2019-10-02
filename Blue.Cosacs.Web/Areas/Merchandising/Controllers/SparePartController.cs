namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Collections.Generic;
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Mappers;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Common;
    using Blue.Glaucous.Client.Mvc;

    public class SparePartController : Controller
    {
        private readonly IProductRepository productRepository;
        private readonly IProductMapper productMapper;

        public SparePartController(IProductRepository productRepository, IProductMapper productMapper)
        {
            this.productRepository = productRepository;
            this.productMapper = productMapper;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.SparePartsEdit)]
        public ViewResult New()
        {
            var product = new Product { ProductType = ProductTypes.SparePart };
            return View("Detail", productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser()));
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Detail(int id)
        {
            var product = productRepository.Get(id);
            if (product.ProductType != ProductTypes.SparePart)
            {
                return RedirectToAction("Detail", product.ProductType, new { id = product.Id });
            }

            return View(productMapper.CreateViewModel(product, Request.RequestContext.HttpContext.GetUser()));
        }
    }
}
