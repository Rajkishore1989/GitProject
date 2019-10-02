using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;
using System;
using System.Linq;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class CintErrorController : Controller
    {
        private readonly ICintErrorRepository repository;

        public CintErrorController(ICintErrorRepository repository)
        {
            this.repository = repository;
        }

        [Permission(MerchandisingPermissionEnum.CintErrorView)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(MerchandisingPermissionEnum.CintErrorView)]
        public JsonResult Search(CintErrorQueryModel query)
        {
            if (query.Bulk)
            {
                return new JSendResult(JSendStatus.Success, repository.SearchBulk(query).Take(500).ToList());
            }
            else
            {
                return new JSendResult(JSendStatus.Success, repository.Search(query).Take(500).ToList());
            }
        }

        [Permission(MerchandisingPermissionEnum.CintErrorView)]
        public JsonResult Export(CintErrorQueryModel query)
        {
            Tuple<string, string> results;

            if (query.Bulk)
            {
                results = repository.ExportBulk(query);
            }
            else
            {
                results = repository.Export(query);
            }
            return new JSendResult(JSendStatus.Success, new { filename = results.Item1, export = results.Item2 });
        }
    }
}