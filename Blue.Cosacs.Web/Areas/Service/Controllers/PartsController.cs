using System.Web.Mvc;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Service;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class PartsController : Controller
    {
        public readonly PartsRepository repository;
        public PartsController(PartsRepository repository)
        {
            this.repository = repository;
        }

        [Permission(ServicePermissionEnum.ViewPartsCostMatrix)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(ServicePermissionEnum.EditPartsCostMatrix)]
        public JsonResult Save(ServicePartsMatrix matrix)
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

        [Permission(ServicePermissionEnum.ViewPartsCostMatrix)]
        public JsonResult GetAll()
        {
            return Json(repository.GetAll(), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewPartsCostMatrix)]
        public JsonResult GetItem(int id)
        {
            return Json(repository.Get(id), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JsonResult GetCharges(CostMatrixQuery query)
        {
            return Json(repository.GetCharges(query), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.EditPartsCostMatrix)]
        public void Delete(int id)
        {
            repository.Delete(id);
        }
    }
}
