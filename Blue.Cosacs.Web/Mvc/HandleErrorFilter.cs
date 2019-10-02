using System;
using System.Web;
using System.Web.Mvc;

namespace Blue.Glaucous.Client.Mvc
{
    public class HandleErrorFilter : HandleErrorAttribute
    {
        public bool MustHandleException(ExceptionContext filterContext)
        {
            if (filterContext == null)
            {
                throw new ArgumentNullException("filterContext");
            }

            if (filterContext.IsChildAction
             || filterContext.ExceptionHandled
             || !filterContext.HttpContext.IsCustomErrorEnabled)
            {
                return false;
            }

            var ctx = filterContext.HttpContext;
            var ex = filterContext.Exception;

            if (new HttpException((string)null, ex).GetHttpCode() != 500
             || !this.ExceptionType.IsInstanceOfType((object)ex))
            {
                return false;
            }

            return true;
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

            // force the logging of the error for us to get the error Id
            var log = global::Elmah.ErrorLog.GetDefault(HttpContext.Current);
            if (log != null)
            {
                var errorLogId = log.Log(new global::Elmah.Error(ex, HttpContext.Current));
                if (errorLogId != null)
                {
                    ctx.Response.Headers[HttpHeaderErrorLogId] = errorLogId;
                    model.ErrorLogId = errorLogId;
                }
            }

            var result = new ViewResult
            {
                ViewName = this.View,
                MasterName = this.Master,
                ViewData = new ViewDataDictionary<HandleErrorInfo>(model),
                TempData = filterContext.Controller.TempData,
            };
            filterContext.Result = result;
            filterContext.ExceptionHandled = true;

            ctx.Response.Clear();
            ctx.Response.StatusCode = 500;
            ctx.Response.StatusDescription = ex.Message;
            ctx.Response.ContentType = "text/html; charset=utf-8";
            ctx.Response.TrySkipIisCustomErrors = true;
        }

        public const string HttpHeaderErrorLogId = "X-ErrorLogId";
    }
}
