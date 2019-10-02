using System;
using System.Data.Entity.Infrastructure;
using System.Web.Mvc;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class TagsController : Controller
    {
        private readonly WarrantyHierachyRepository warrantyRepository;
        private readonly WarrantyAPIController warrantyApiController;
        private readonly HierarchyController hierarchyController;

        public TagsController(WarrantyHierachyRepository warrantyRepository, WarrantyAPIController warrantyApiController, HierarchyController hierarchyController)
        {
            this.warrantyRepository = warrantyRepository;
            this.warrantyApiController = warrantyApiController;
            this.hierarchyController = hierarchyController;
        }

        [HttpPost]
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.TagManagement)]
        public ActionResult Create(Models.Tag tag)
        {
            try
            {
                var newTag = warrantyRepository.Save(new WarrantyTag { Name = tag.Name, Level = new WarrantyLevel { Id = tag.Level.Id, Name = tag.Level.Name } });
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
        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.TagManagement)]
        public ActionResult Update(int id, Models.Tag tag)
        {
            try
            {
                var updatedTag = warrantyRepository.Save(new WarrantyTag { Id = id, Name = tag.Name, Level = new WarrantyLevel { Id = tag.Level.Id, Name = tag.Level.Name } });
                warrantyApiController.ForceIndex();
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
        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.TagManagement)]
        public ActionResult Delete(int id)
        {
            try
            {
                warrantyRepository.DeleteTag(id);
                warrantyApiController.ForceIndex();
                return Json(new { Success = true, HierarchyData = hierarchyController.GetHierarchyData().Data });
            }
            catch (ApplicationException ex)
            {
                return Json(new { Success = false, Error =  ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}
