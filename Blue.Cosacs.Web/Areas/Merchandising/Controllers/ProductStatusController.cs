namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Linq;
    using System.Net;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Microsoft.Practices.ObjectBuilder2;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class ProductStatusController : Controller
    {
        private readonly IProductStatusRepository productRepository;
        private readonly Settings settings;
        private readonly IProductStatusProgresser productStatusProgresser;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public ProductStatusController(IProductStatusRepository prodRepository, Settings settings, IProductStatusProgresser productStatusProgresser, IStockSolrIndexer stockSolrIndexer)
        {
            this.productRepository = prodRepository;
            this.settings = settings;
            this.productStatusProgresser = productStatusProgresser;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public ActionResult Index()
        {
            var statuses = productRepository.Get();
            return
                View(
                    new ProductStatusViewModel()
                        {
                            SystemStatuses = statuses.Where(s => s.IsSystem),
                            ManualStatuses = statuses.Where(s => !s.IsSystem)
                        });
        }

        public JsonResult Get()
        {
            return new JSendResult(JSendStatus.Success, productRepository.Get());
        }

        public JsonResult Get(int id)
        {
            return new JSendResult(JSendStatus.Success, productRepository.Get(id));
        }

        [HttpGet]
        [CronJob]
        [LongRunningQueries]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        public HttpStatusCodeResult Progress()
        {
            if (settings.ActiveNewMigrationPeriod <= 0)
            {
                return new HttpStatusCodeResult((int)HttpStatusCode.BadRequest, string.Format("Invalid Active New Migration Period"));
            }

            var productIds = productStatusProgresser.ElapsedProgress();

            if (productIds.Any())
            {
                this.stockSolrIndexer.Index(productIds.ToArray());
            }

            return new HttpStatusCodeResult((int)HttpStatusCode.OK);
        }

        [Permission(MerchandisingPermissionEnum.ProductsWithoutStockEdit)]
        public JsonResult Create(ProductStatus model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","), data: new { supplier = model });
            }
            var supplier = Save(model);
            return new JSendResult(JSendStatus.Success, new { supplier });
        }

        [Permission(MerchandisingPermissionEnum.ProductsWithoutStockEdit)]
        public JsonResult Update(ProductStatus model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","), data: new { supplier = model });
            }
            var supplier = Save(model);
            return new JSendResult(JSendStatus.Success, new { supplier });
        }

        [Permission(MerchandisingPermissionEnum.ProductsWithoutStockEdit)]
        public JsonResult Delete(int id)
        {
            if (!productRepository.CanDelete(id))
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Unable to delete a status that is assigned to products");
            }
            try
            {
                this.productRepository.Delete(id);
            }
            catch (Exception)
            {
                return new JSendResult(JSendStatus.Error, message: "Unable to delete status. An error occurred on the server.");
            }
            return new JSendResult(JSendStatus.Success);
        }

        private ProductStatus Save(ProductStatus model)
        {
           return this.productRepository.Save(model);
        }
    }
}
