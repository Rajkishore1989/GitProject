using System.Web.Mvc;
using Blue.Cosacs.Service;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Events;
using System.Net;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class SupplierCostsController : Controller
    {
        public SupplierCostsController(IClock clock, SupplierCostsRepository repository, IEventStore audit)
        {
            this.clock = clock;
            this.repository = repository;
            this.audit = audit;
        }

        private readonly IClock clock;
        private readonly SupplierCostsRepository repository;
        private readonly IEventStore audit;

        [Permission(Blue.Service.ServicePermissionEnum.SupplierCostMatrix)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpPut]
        [Permission(Blue.Service.ServicePermissionEnum.SupplierCostMatrix)]
        public ActionResult Save(SupplierCosts supplierCosts)
        {
            if (!TryValidateModel(supplierCosts))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
            }

            if (repository.AreUnique(supplierCosts))
            {
                audit.LogAsync(new { costMatrix = supplierCosts }, EventType.SaveCostMatrix, EventCategory.Service);
                repository.Save(supplierCosts);
                return Json(new { Result = 1, Message = "Saved succesfully." });
            }
            else
            {
                return Json(new { Result = 0, Message = "You're trying to save duplicate rows." });
            }            
        }

        [HttpGet]
        [Permission(Blue.Service.ServicePermissionEnum.SupplierCostMatrix)]
        public JsonResult GetSupplierCosts(string supplier, string product)
        {
            var result = repository.GetSupplierCosts(supplier, product);
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(Blue.Service.ServicePermissionEnum.CreateServiceRequest)]
        public JsonResult GetSupplierCostsInLocalCurrency(string supplier, string product)
        {
            var result = repository.GetSupplierCostsWithExchangeRate(supplier, product);
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetProducts(string supplier)
        {
            return Json(repository.GetProducts(supplier), JsonRequestBehavior.AllowGet);
        }

        /*[HttpGet]
        public JsonResult GetPartType(string supplier, string product)
        {
            return Json(repository.GetPartType(supplier, product), JsonRequestBehavior.AllowGet);
        }*/
    }
}
