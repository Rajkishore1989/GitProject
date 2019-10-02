namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Microsoft.Practices.ObjectBuilder2;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Glaucous.Client.Mvc;

    public class CostPriceController : Controller
    {
        private readonly ICostRepository costRepository;
        private readonly IStockSolrIndexer stockSolrIndexer;
        
        public CostPriceController(ICostRepository costRepository, IStockSolrIndexer stockSolrIndexer)
        {
            this.costRepository = costRepository;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        [Permission(MerchandisingPermissionEnum.CostPriceEdit)]
        public JsonResult Create(CostPriceCreateModel model)
        {
            return Save(model);
        }

        [Permission(MerchandisingPermissionEnum.CostPriceEdit)]
        public JsonResult Update(CostPriceCreateModel model)
        {
            return Save(model);
        }

        private JSendResult Save(CostPriceCreateModel model)
        {
            if (ModelState.IsValid)
            {
                var result = costRepository.Save(model);
                ForceIndex(new[] { result.ProductId });
                return new JSendResult(JSendStatus.Success, result);
            }
            return new JSendResult(JSendStatus.BadRequest, message: ModelState.GetErrors().JoinStrings(","), data: new { supplier = model });
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] productIds = null)
        {
            this.stockSolrIndexer.Index(productIds);
        }
    }
}
