using System.Text;
using System.Web.Mvc;
using Blue.Admin;

namespace Blue.Glaucous.Client.Mvc
{
    public class HandleErrorFilterPermissionException : HandleErrorFilter
    {
        public HandleErrorFilterPermissionException()
        {
            ExceptionType = typeof(PermissionException);
        }

        public override void OnException(ExceptionContext filterContext)
        {
            if (!this.MustHandleException(filterContext))
            {
                return;
            }

            var ctx = filterContext.HttpContext;
            var ex = filterContext.Exception;

            var controllerName = (string)filterContext.RouteData.Values["controller"];
            var actionName = (string)filterContext.RouteData.Values["action"];
            var model = new HandleErrorInfoExtended(filterContext.Exception, controllerName, actionName);

            // X-Requested-With: XMLHttpRequest
            var requestWith = filterContext.RequestContext.HttpContext.Request.Headers["X-Requested-With"];
            if (requestWith == null || string.Compare(requestWith, "XMLHttpRequest", true) != 0)
            {
                var result = new ViewResult
                {
                    ViewName = "Forbidden",
                    MasterName = this.Master,
                    ViewData = new ViewDataDictionary<HandleErrorInfo>(model),
                };
                result.ViewBag.ErrorDescription = ex.Message;

                filterContext.Result = result;
            }
            else 
            {
                // is ajax request
                filterContext.Result = new ContentResult
                {
                    ContentType = "text/plain",
                    Content = ex.Message,
                    ContentEncoding = Encoding.UTF8
                };
            }

            filterContext.ExceptionHandled = true;

            ctx.Response.Clear();
            ctx.Response.StatusCode = 403;
            ctx.Response.StatusDescription = ex.Message;
            ctx.Response.TrySkipIisCustomErrors = true;
        }
    }
}
