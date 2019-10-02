using System;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class RetailPriceController : Controller
    {
        private readonly IRetailPriceRepository retailPriceRepository;
        private readonly IStockSolrIndexer stockSolrIndexer;

        public RetailPriceController(IRetailPriceRepository retailPriceRepository, IStockSolrIndexer stockSolrIndexer)
        {
            this.retailPriceRepository = retailPriceRepository;
            this.stockSolrIndexer = stockSolrIndexer;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RetailPriceEdit)]
        public JSendResult Create(RetailPriceViewModel retailPrice)
        {
            if (this.retailPriceRepository.IsDuplicate(retailPrice))
            {
                ModelState.AddModelError(string.Empty,  "A retail price already exists for this product and fascia/location for the specified date.");
            }

            if (retailPrice.EffectiveDate.Date < DateTime.Now.Date)
            {
                ModelState.AddModelError("effectiveDate", "The effective date cannot be in the past.");
            }

            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message:string.Join(",", ModelState.GetErrors()));
            }

            retailPrice = this.retailPriceRepository.Save(retailPrice);
            ForceIndex(new[] { retailPrice.ProductId });
            return new JSendResult(JSendStatus.Success, retailPrice);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RetailPriceEdit)]
        public JSendResult Delete(RetailPriceViewModel retailPrice)
        {
            var price = retailPriceRepository.Get(retailPrice.LocationId, retailPrice.Fascia, retailPrice.ProductId, retailPrice.EffectiveDate.Date);

            if (price.EffectiveDate.Value.Date < DateTime.Now.Date)
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Cannot delete a retail price that is already in effect");
            }

            retailPriceRepository.Delete(price.LocationId , price.Fascia, price.ProductId, price.EffectiveDate.Value);
            ForceIndex(new[] { price.ProductId });
            return new JSendResult(JSendStatus.Success);
        }

        [LongRunningQueries]
        [Permission(Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] productIds = null)
        {
            this.stockSolrIndexer.Index(productIds);
        }
    }
}
