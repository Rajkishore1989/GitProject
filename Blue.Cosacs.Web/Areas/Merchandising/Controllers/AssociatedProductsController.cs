namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class AssociatedProductsController : Controller
    {
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;
        private readonly IProductRepository productRepository;

        public AssociatedProductsController(IMerchandisingHierarchyRepository hierarchyRepository, IProductRepository productRepository)
        {
            this.hierarchyRepository = hierarchyRepository;
            this.productRepository = productRepository;
        }

        [Permission(MerchandisingPermissionEnum.AssociatedProductsView)]
        public ActionResult Index()
        {
            var hierarchyOpts = this.hierarchyRepository.GetSortedList();
            var hierarchy = hierarchyOpts.ToDictionary(h => h.Key, h => string.Empty);

            var associated = this.productRepository.GetAssociatedProducts();
            var model = new AssociatedProductViewModel { Hierarchy = hierarchy, HierarchyOptions = this.hierarchyRepository.GetSortedList(), AssociatedProducts = associated };
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JSendResult SelectSearch(string q)
        {
            const string SolrType = "MerchandiseStockSummary";

            var filter =
                string.Format(
                    "Type:{0} AND " +
                    "!ProductType:Combo AND " +
                    "!ProductType:Set AND " +
                    "!ProductType:SparePart AND " +
                    "!ProductType:RepossessedStock AND " +
                    "!ProductStatus:Deleted AND " +
                    "!ProductStatus:Discontinued AND " +
                    "!ProductStatus:\"Non Active\"",
                    SolrType);

            return new JSendResult(JSendStatus.Success, new Lunr().Search<StockLunrModel>(q, filter));
        }

        [Permission(MerchandisingPermissionEnum.AssociatedProductsView)]
        public string GetAssociatedProducts(int productId)
        {
            var associations = this.productRepository.GetAssociatedProducts();
            var itemHierarchy = this.hierarchyRepository.GetHierarchy(productId);
            var associatedSkus = associations.Where(y => y.Hierarchy.All(x => string.IsNullOrEmpty(x.Value)
                                                    ? true
                                                    : itemHierarchy.Keys.Contains(x.Key, System.StringComparer.OrdinalIgnoreCase)
                                                        ? x.Value.Equals(itemHierarchy[x.Key], System.StringComparison.OrdinalIgnoreCase)
                                                        : false))
                                                    .Select(x => x.SKU)
                                                    .Distinct()
                                                    .ToList();

            var queryString = associatedSkus
                   .Take(associatedSkus.Count - 1)
                   .Select(p => string.Format("Sku={0} OR ", p))
                   .Union(associatedSkus.Skip(associatedSkus.Count - 1)
                        .Select(p => string.Format("Sku={0}", p))
                        .ToList())
                   .ToList();

            if (queryString.Count > 0)
            {
                return new Solr.Query().SelectJsonWithJsonQuery(
                            string.Empty,
                            string.Format("Type:MerchandiseStockSummary AND !ProductStatus:Deleted AND !ProductStatus:\"Non Active\" AND !ProductStatus:Discontinued AND ({0})", string.Join(" ", queryString.ToArray())),
                            start: 0,
                            rows: 50,
                            showEmpty: false);
            }

            return string.Empty;
        }
    }
}