using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using StructureMap;
using Blue.Admin;

namespace Blue.Cosacs.Web.Controllers
{
    using System;

    using Blue.Cosacs.Merchandising.Helpers;

    public class PickListsController : Controller
    {
        public PickListsController(IContainer container, IClock clock)
        {
            this.container = container;
            this.clock = clock;
        }

        private readonly IContainer container;
        private readonly IClock clock;

        /// <summary>
        /// List all the PickLists available for use by the developer.
        /// The PickLists are modular and only fully known at runtime by being Dependency Injected with StructureMap (i.e. IContainer)
        /// </summary>

        //[Permission(AdminPermissionEnum.ViewPickLists)]
        [HttpGet]
        public ActionResult Index()
        {
            var providers = container.GetAllInstances<IPickListProvider>().OrderBy(p => p.Id);
            return View(providers);
        }

        //[Permission(AdminPermissionEnum.ViewPickLists)]
        [HttpGet]
        public ActionResult Details(string id)
        {
            var provider = container.GetInstance<IPickListProvider>(id);
            return View(provider);
        }

        [HttpGet]
        public JsonResult ListDetails(string id)
        {
            var provider = container.GetInstance<IPickListProvider>(id);
            return Json(new
                {
                    id = id,
                    list = provider.Load()
                }, JsonRequestBehavior.AllowGet);
        }


        //[Permission(AdminPermissionEnum.ViewPickLists)]
        [HttpGet]
        public ActionResult Load(string ids)
        {
            return Load(ids.Split(',').Where(s => s.Trim().Length > 0).ToArray());
        }

        //[Permission(AdminPermissionEnum.ViewPickLists)]
        [HttpPost]
        public ActionResult Load(string[] ids)
        {
            var providers = container.GetAllInstances<IPickListProvider>().ToDictionary(p => p.Id);
            var result = new Dictionary<string, object>(ids.Length);
            foreach (var id in ids)
            {
                var provider = providers[id];

                if (provider == null)
                    return new HttpNotFoundResult("There is no PickList provider with Id = " + id);

                result[id] = new
                {
                    timestamp = clock.UtcNow.Ticks,
                    rows = ToDictionary(provider.Load())
                };
            }
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        private IDictionary<string, string> ToDictionary(IEnumerable<IPickListRow> rows)
        {
            return rows.ToDictionary(r => r.k, r => r.v);
        }
    }
}
