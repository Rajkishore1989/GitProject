using System.Net;
using System.Web.Mvc;

namespace Blue.Glaucous.Client.Mvc.Controllers
{
    public class NotFoundController : Controller
    {
        protected override void ExecuteCore()
        {
            if (ControllerContext.RequestContext.HttpContext.Request.IsAjaxRequest())
            {
                var response = ControllerContext.RequestContext.HttpContext.Response;
                response.StatusCode = (int)HttpStatusCode.NotFound;
                response.StatusDescription = "Not Found";
                response.TrySkipIisCustomErrors = true;
                response.End();
            }
            else
            {
                ControllerContext.RequestContext.HttpContext.Response.StatusCode = 404;
                var result = new ViewResult { ViewName = "NotFound" };
                result.ExecuteResult(ControllerContext);
            }
        }
    }
}
