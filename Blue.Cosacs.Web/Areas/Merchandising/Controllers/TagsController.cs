namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising;
    using System;
    using System.Data.Entity.Infrastructure;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class TagsController : Controller
    {
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public TagsController(IMerchandisingHierarchyRepository hierarchyRepository)
        {
            this.hierarchyRepository = hierarchyRepository;
        }

        [HttpPost]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Create(Models.Tag tag)
        {
            try
            {
                var code = HiLo.Cache("Merchandising.HierarchyTagCode");
                var newTag = hierarchyRepository.Save(new Tag { Name = tag.Name, Level = new Level { Id = tag.Level.Id, Name = tag.Level.Name, } },code.NextId().ToString());
                return Json(new { Tag = new Models.Tag(newTag) });
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Tag = tag, Message = message });
            }
        }

        [HttpPut]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Update(int id, Models.Tag tag)
        {
            try
            {
                var updatedTag = hierarchyRepository.Save(new Tag { Id = id, Name = tag.Name, Level = new Level { Id = tag.Level.Id, Name = tag.Level.Name } });
                return Json(new Models.Tag(updatedTag));
            }
            catch (DbUpdateException se)
            {
                Response.StatusCode = 400;
                var message = "Error";
                if (se.InnerException.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    message = "Duplicate";
                }

                return Json(new { Tag = tag, Message = message });
            }
        }

        [HttpDelete]
        [Permission(MerchandisingPermissionEnum.HierarchyEdit)]
        public ActionResult Delete(int id)
        {
            try
            {
                var message = hierarchyRepository.CanDeleteTag(id);
                if (!string.IsNullOrEmpty(message))
                {
                    return new JSendResult(JSendStatus.BadRequest, message: string.Format("Unable to delete a Tag that is assigned to {0}", message));
                }
                hierarchyRepository.DeleteTag(id);
                var tags = hierarchyRepository.GetAllTags();
                var levels = hierarchyRepository.GetAllLevels();
                return new JSendResult(JSendStatus.Success, new { Levels = levels, Tags = tags }, camelCase: false);
            }
            catch (ApplicationException)
            {
                return new JSendResult(JSendStatus.Error);
            }
        }
    }
}
