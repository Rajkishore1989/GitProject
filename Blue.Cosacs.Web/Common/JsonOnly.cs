using System.Reflection;
using System.Web.Mvc;

namespace Blue.Cosacs.Web
{
    public class JsonOnly : ActionMethodSelectorAttribute
    {
        public override bool IsValidForRequest(ControllerContext controllerContext, MethodInfo methodInfo)
        {
            return string.Compare(controllerContext.RequestContext.HttpContext.Request.ContentType,
                JsonContentType, true) == 0;
        }

        public const string JsonContentType = "application/json";
    }
}