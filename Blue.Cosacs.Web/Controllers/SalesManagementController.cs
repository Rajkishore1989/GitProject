using Blue.Cosacs.Service.Repositories;
using Blue.Networking;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class SalesManagementController : Controller
    {
        public JsonResult HasItemInService(string customerId)
        {
            var repository = new SalesManagementRepository();

            return Json(
                new
                {
                    HasServiceRequest = repository.HasItemInService(customerId)
                },
                JsonRequestBehavior.AllowGet);
        }
    }
}