namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Warranty;
    using Blue.Glaucous.Client.Mvc;

    public class ProductEnquiryController : Controller
    {
        private IMerchandisingHierarchyRepository hierarchy;
        
        public ProductEnquiryController(IMerchandisingHierarchyRepository hierarchy)
        {
            this.hierarchy = hierarchy;
        }

        [HttpGet]
        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.ProductEnquiry)]
        public ActionResult Index(string q = "")
        {
            //ViewBag.title = "Product Enqiury";
            //LoadMasterDataForWarrantyEdit();
            var standardFields = new string[] { "\"Tags\" : \"Product Tags\"", "\"ProductType\" : \"Product Type\"", "\"ProductStatus\" : \"Status\"", "\"StoreTypes\" : \"Store Types\"", "\"Vendors\" : \"Vendors\"" };
            var levelFields = hierarchy.GetAllLevels().Select(l => string.Format("\"MerchandisingLevel_{0}\" : \"{1}\"", l.Id, l.Name));
            ViewBag.labels = "{ " + string.Join(", ", levelFields.Union(standardFields)) + " }";
            return View(model: SearchSolr(q, new[] { "Tags", "ProductType", "ProductStatus", "StoreTypes", "Vendors" }));
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, new[] { "Tags", "ProductType", "ProductStatus", "StoreTypes", "Vendors" }, start);
            Response.Write(result);
        }
         
        private string SearchSolr(string q, string[] nonHierarchyFields, int start = 0, int rows = 25, string type = "MerchandiseStockSummary")
        {
            var fields = hierarchy.GetAllLevels().Select(l => "MerchandisingLevel_" + l.Id).Concat(nonHierarchyFields);

            var result = new Solr.Query().SelectJsonWithJsonQuery(
                q,
                "Type:" + type,
                facetFields: fields.ToArray(),
                showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                start: start,
                rows: rows);

            return result;
        }
    }
}
