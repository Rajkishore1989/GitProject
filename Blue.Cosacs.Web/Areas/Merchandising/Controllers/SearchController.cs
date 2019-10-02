namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web.Mvc;
    using System.Web.Script.Serialization;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Web.Areas.Merchandising.Models;
    using Blue.Glaucous.Client.Mvc;

    public class SearchController : Controller
    {
        private readonly ILog log;

        public SearchController(ILog log)
        {
            this.log = log;
        }

        [Permission(MerchandisingPermissionEnum.ViewStock)]
        public JsonResult ProductSkus(string keywords, int start = 0, int rows = 10)
        {
            try
            {
                var solrResult = new Solr.Query().SelectJson(
                    "Type:Product",
                    facetFields: null,
                    start: start,
                    rows: rows,
                    filter: "+" + keywords,
                    indent: false,
                    sort: null,
                    showEmpty: false,
                    fields: "Id,ProductItemNo,ProductItemId,Description1,Description2");
                
                var solrRecords =
                    new JavaScriptSerializer().Deserialize<SolrResultProduct>(solrResult);

                var result = solrRecords.Response.Docs
                    .Select(s => new KeyValuePair<string, string>(
                        s.Id.Replace("Product:", string.Empty),
                        string.Format("{0} {1}", s.Description1.Trim(), s.Description2.Trim())));
              
                return Json(result, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                log.Exception(ex);
            }
            return null;
        }
    }
}
