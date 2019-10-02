namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Events;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class HierarchyController : Controller
    {
        private readonly IEventStore audit;
        private readonly IMerchandisingHierarchyRepository repository;

        public HierarchyController(IMerchandisingHierarchyRepository repository, IEventStore audit)
        {
            this.repository = repository;
            this.audit = audit;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.HierarchyView)]
        [HttpGet]
        public ActionResult Index()
        {
            var hierarchyData = GetHierarchyData();
            return View("Index", model: hierarchyData.Data.ToJson());
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.HierarchyView)]
        public JsonResult GetHierarchyData()
        {
            var tags = repository.GetAllTags();
            var levels = repository.GetAllLevels();
            return Json(new { Levels = levels, Tags = tags }, JsonRequestBehavior.AllowGet);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.HierarchyView)]
        public JsonResult Get(int? levelId = null)
        {
            return new JSendResult(JSendStatus.Success, repository.Get(levelId));
        }
    }
}
