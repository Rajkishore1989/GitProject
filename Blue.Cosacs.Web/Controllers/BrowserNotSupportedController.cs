using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class BrowserNotSupportedController : Controller
    {
        protected override void ExecuteCore()
        {
            ControllerContext.RequestContext.HttpContext.Response.StatusCode = 400;
            var result = new ViewResult { ViewName = "BrowserNotSupported" };
            result.ExecuteResult(ControllerContext);
        }
    }
}
