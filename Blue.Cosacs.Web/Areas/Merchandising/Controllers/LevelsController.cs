namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Data.Entity.Infrastructure;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising;
    using Blue.Glaucous.Client.Mvc;

    public class LevelsController : Controller
    {
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public LevelsController(IMerchandisingHierarchyRepository hierarchyRepository)
        {
            this.hierarchyRepository = hierarchyRepository;
        }

        [HttpPost]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Create(Models.Level level)
        {
            try
            {
                var newLevel = hierarchyRepository.Save(new Level { Name = level.Name });
                return Json(new { Level = new Models.Level(newLevel) });
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Level = level, Message = message });
            }
        }

        [HttpPut]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Update(int id, Models.Level level)
        {
            try
            {
                var updatedLevel = hierarchyRepository.Save(new Level { Id = id, Name = level.Name });
                return Json(new Models.Level(updatedLevel));
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Level = level, Message = message });
            }
        }

        [HttpDelete]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Delete(int id)
        {
            hierarchyRepository.DeleteLevel(id);
            return Json(new { });
        }
    }
}
