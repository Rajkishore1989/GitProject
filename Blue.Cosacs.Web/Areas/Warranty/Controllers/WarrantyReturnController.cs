using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty;
using StructureMap.Query;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantyReturnController : Controller
    {
        private HierarchyController hierarchyController;
        private WarrantyReturnRepository warrantyReturnRepository;

        public WarrantyReturnController(WarrantyReturnRepository warrantyReturnRepository, HierarchyController hierarchyController)
        {
            this.warrantyReturnRepository = warrantyReturnRepository;
            this.hierarchyController = hierarchyController;
        }

        [Permission(WarrantyPermissionEnum.ReturnPercentagesView)]
        public ActionResult Index()
        {
            var branches = new Web.Common.BranchPickListProvider().Load().ToDictionary(r => r.k, r => r.v);
            var branchTypes = new Web.Common.SetsPickListProvider("fascia").Load().ToDictionary(r => r.k, r => r.v);
            var hierarchyData = hierarchyController.GetHierarchyData().Data;
           // var returnPercentages = warrantyReturnRepository.GetReturns();

            ViewBag.viewWarrantyPermission = this.GetUser().HasPermission(WarrantyPermissionEnum.WarrantyView);
            ViewBag.editPercentagePermission = this.GetUser().HasPermission(WarrantyPermissionEnum.ReturnPercentagesEdit);

            return View("Index", model: new
            {
                filters = new {hierarchyData, branches, branchTypes },
                returnPercentages = new List<WarrantyReturnModel>()
            }.ToJson());
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.ReturnPercentagesView)]
        [HttpGet]
        public ActionResult List()
        {
            var returnPercentages = warrantyReturnRepository.GetReturns();
            return Json(returnPercentages, JsonRequestBehavior.AllowGet);
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.ReturnPercentagesEdit)]
        [HttpPost]
        public ActionResult Create(WarrantyReturnModel returnPercentage)
        {
            var newreturn = warrantyReturnRepository.Save(returnPercentage);
            return Json(newreturn);
        }

        [Permission(Blue.Cosacs.Warranty.WarrantyPermissionEnum.ReturnPercentagesEdit)]
        [HttpDelete]
        public ActionResult Delete(int id)
        {
            warrantyReturnRepository.Delete(id);
            return Json(new { Success = true });
        }

        // No permissions as this is required by cosacs classic. If you add them make sure you have error reporting on cosacs classic.
        public JsonResult Get(string warrantyNumber, int branch, int elapsedMonths, int freeWarrantyLength = 12)
        {
            var returnData = warrantyReturnRepository.Get(warrantyNumber, branch, elapsedMonths, freeWarrantyLength);
            return Json(returnData, JsonRequestBehavior.AllowGet);
        }

        [Permission(WarrantyPermissionEnum.ReturnPercentagesView)]
        [HttpPost]
        public JsonResult GetAll(WarrantyReturnSearch search)
        {
            return Json(warrantyReturnRepository.GetAllReturns(search), //.FirstOrDefault(),
                        JsonRequestBehavior.AllowGet);
        }


    }
}
