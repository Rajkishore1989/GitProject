using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Cosacs.Web.Areas.Admin.Models;
using Blue.Events;
using System.Text;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class BranchOpeningHoursController : Controller
    {
        protected readonly IEventStore audit;

        public BranchOpeningHoursController(IEventStore audit)
        {
            this.audit = audit;
        }

        [Permission(Blue.Admin.AdminPermissionEnum.BranchOpeningHours)]
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(Blue.Admin.AdminPermissionEnum.BranchOpeningHours)]
        [HttpPost]
        public JsonResult Index(BranchOpeningHoursModel[] values)
        {
            var repository = new Blue.Admin.BranchOpeningHours();

            var oldData = this.LoadData().OrderBy(p => p.BranchNo).ToArray();

            repository.Save(values
                .Select(p => BranchOpeningHoursModel.ConvertTo(p))
                .ToList());

            this.AuditLog(oldData, values);

            return Json(new
            {
                Message = "Branch Opening Hours Saved Successfully"
            });
        }

        private void AuditLog(BranchOpeningHoursModel[] oldData, BranchOpeningHoursModel[] newData)
        {
            audit.LogAsync(BranchOpeningHoursModel.AuditChanges(oldData, newData), 
                Blue.Admin.Event.EventType.BranchOpening, Blue.Admin.Event.EventCategory.Admin);
        }

        [Permission(Blue.Admin.AdminPermissionEnum.BranchOpeningHours)]
        public JsonResult GetData()
        {
            return Json(LoadData(), JsonRequestBehavior.AllowGet);
        }

        private List<BranchOpeningHoursModel> LoadData()
        {
            var context = new Blue.Admin.BranchOpeningHours();

            return context.GetData()
                    .Select(p => BranchOpeningHoursModel.ConvertFrom(p))
                    .ToList();
        }
    }
}