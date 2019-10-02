using System;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class TestsController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Throw()
        {
            throw new ApplicationException("Test exception");
        }

        public ActionResult JsThrow()
        {
            return View();
        }
    }
}
