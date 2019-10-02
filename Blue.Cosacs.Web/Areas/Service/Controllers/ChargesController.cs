using System.Web.Mvc;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Service;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class ChargesController : Controller
    {
        public readonly ChargesRepository repository;
        public ChargesController(ChargesRepository repository)
        {
            this.repository = repository;
        }

        [Permission(ServicePermissionEnum.ViewLabourCostMatrix)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(ServicePermissionEnum.EditLabourCostMatrix)]
        public JsonResult Save(ServiceLabour matrix)
        {
            try
            {
                return Json(repository.Save(matrix), JsonRequestBehavior.AllowGet);
            }
            catch (ServiceLabourException ex)
            {
                return Json(new
                {
                    Message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        [Permission(ServicePermissionEnum.ViewLabourCostMatrix)]
        public JsonResult GetAll()
        {
            return Json(repository.GetAll(), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewLabourCostMatrix)]
        public JsonResult GetItem(int id)
        {
            return Json(repository.Get(id), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JsonResult GetCharges(CostMatrixQuery query)
        {
            return Json(repository.GetCharges(query), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.EditLabourCostMatrix)]
        public void Delete(int id)
        {
            repository.Delete(id);
        }
    }
}
