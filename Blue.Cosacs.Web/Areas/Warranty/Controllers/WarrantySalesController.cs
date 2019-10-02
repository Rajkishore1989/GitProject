using System.Web.Mvc;
using Blue.Cosacs.Warranty;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantySalesController : Controller
    {
        [Permission(WarrantyPermissionEnum.SalesHistoryView)]
        public ActionResult Index(string q = "")
        {
            ViewBag.viewWarrantyPermission = this.GetUser().HasPermission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.WarrantyView);
            return View("Index", model: SearchSolr(q));
        }

        [HttpGet]
        [Permission(WarrantyPermissionEnum.SalesHistoryView)]
        public void SearchInstant(string q, int start = 0, int rows = 25)
        {
            var result = SearchSolr(q, start, rows);
            Response.Write(result);
        }

        [Permission(Blue.Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public void ForceIndex(int[] warrantySaleIds = null)
        {
            Blue.Cosacs.Warranty.Solr.SolrIndex.IndexWarrantySale(warrantySaleIds);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "WarrantySale")
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(q, "Type:" + type, 
                    facetFields: new[] { "SaleBranchName", "SoldBy", "ItemSupplier", "WarrantySaleStatus", "Free" }, 
                    showEmpty: false, start: start,rows: rows);
        }
    }
}
