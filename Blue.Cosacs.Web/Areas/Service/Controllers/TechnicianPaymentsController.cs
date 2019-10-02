using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Events;
using Blue.Cosacs.Service;
using Blue.Cosacs.Service.Repositories;
using Blue.Cosacs.Web.Areas.Service.Models;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Service.Models;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class TechnicianPaymentsController : Controller
    {
        public TechnicianPaymentsController(TechnicianRepository repository, IEventStore audit)
        {
            this.repository = repository;
            this.audit = audit;
        }
        private readonly TechnicianRepository repository;
        private readonly IEventStore audit;

        [Permission(Blue.Service.ServicePermissionEnum.ViewTechnicianPayments)]
        public ActionResult Index()
        {
            this.ViewBag.canEditTechnicianPayments = this.GetUser().HasPermission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments);  
            return View();
        }

        [Permission(Blue.Service.ServicePermissionEnum.ViewMyPayments)]
        public ActionResult MyPayments()
        {
            var user = this.GetUser();
            var userId = user.Id;

            this.ViewBag.canEditTechnicianPayments = user.HasPermission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments); 
            return View(userId);
        }

        public JsonResult GetPayments(TechnicianPaymentSearch search)
        {
            var user =  this.GetUser();

            //need perdition to search for service request
            if (!string.IsNullOrWhiteSpace(search.ServiceRequest) && !user.HasPermission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments))
            {
                var container = StructureMap.ObjectFactory.Container;
                throw new Blue.Admin.PermissionException(container, Blue.Service.ServicePermissionEnum.EditTechnicianPayments);
            }

            if (user.HasPermission(Blue.Service.ServicePermissionEnum.ViewTechnicianPayments) || user.HasPermission(Blue.Service.ServicePermissionEnum.ViewMyPayments))
            {
                return Json(repository.GetTechnicianPayments(search), JsonRequestBehavior.AllowGet);
            }
            else
            {
                throw new Blue.Admin.PermissionException("ViewTechnicianPayments");
            }
        }

        [Permission(Blue.Service.ServicePermissionEnum.ViewTechnicianPayments)]
        public JsonResult GetAllTechnicians()
        {
            return Json(repository.GetTechniciansWithPayments(), JsonRequestBehavior.AllowGet);
        }

        [Permission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments)]
        public JsonResult RemovePayment(int id)
        {
            audit.LogAsync(new { RequestId = id }, EventType.Delete, EventCategory.TechnicianPayments);
            return Json(repository.RemoveTechnicianPayment(id), JsonRequestBehavior.AllowGet);
        }

        [Permission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments)]
        public JsonResult HoldPayment(int id, bool hold)
        {
            audit.LogAsync(new { RequestId = id }, hold ? EventType.Hold : EventType.UnHold, EventCategory.TechnicianPayments);
            return Json(repository.HoldTechnicianPayment(id, hold), JsonRequestBehavior.AllowGet);
        }

        [Permission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments)]
        public JsonResult Pay(int[] ids)
        {
            audit.LogAsync(new { RequestId = ids }, EventType.Pay, EventCategory.TechnicianPayments);
            return Json(repository.PayTechnicianPayment(ids), JsonRequestBehavior.AllowGet);

        }

        [Permission(Blue.Service.ServicePermissionEnum.EditTechnicianPayments)]
        public JsonResult HoldAll(int[] ids, bool hold)
        {
            audit.LogAsync(new { RequestId = ids }, hold ? EventType.Hold : EventType.UnHold, EventCategory.TechnicianPayments);
            return Json(repository.HoldAllTechnicianPayment(ids, hold), JsonRequestBehavior.AllowGet);

        }

        public FileResult Export(string ids)
        {
            var payments = repository.GetTechnicianPayments(ids.Split(',').Select(i => Convert.ToInt32(i)));
            var file = "RequestId,AllocatedOn,Labour,PartsOther,Total,State\n" +
                BaseImportFile<ExportTechnicianPayment>.WriteToString(payments
                .Select(p => (ExportTechnicianPayment)p)
                .ToList());
            audit.LogAsync(new
            {
                RequestId = ids
            }, EventType.ExportTechnicianPayments, EventCategory.TechnicianPayments);

            return File(
                System.Text.Encoding.GetEncoding("Windows-1252").GetBytes(file), 
                "text/plain",
                string.Format("{0} Payments.csv", payments.First().FullName).Replace(new string(System.IO.Path.GetInvalidFileNameChars()), string.Empty));
        }

        public ViewResult Print(TechnicianPaymentPrint search, string ids)
        {
            audit.LogAsync(new
            {
                RequestId = ids
            }, EventType.PrintTechnicianPayments, EventCategory.TechnicianPayments);

            var result = new TechnicianPaymentsPrint();

            result.Payments = repository.GetTechnicianPayments(ids.Split(',').Select(i => Convert.ToInt32(i)))
                .Select(p => (ExportTechnicianPayment)p)
                .ToList();

            if (string.IsNullOrEmpty(search.Technician))
            {
                search.Technician = this.GetUser().Login;
            }

            result.SearchCriteria = search;

            ViewBag.User ="";
            ViewBag.DatePrinted = DateTime.Now.ToString();

            return View("TechnicianPaymentsPrint", result);
        }
    }
}
