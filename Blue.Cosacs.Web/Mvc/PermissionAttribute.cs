using System;
using System.Web.Mvc;

namespace Blue.Glaucous.Client.Mvc
{
    using System.Text;

    [AttributeUsage(AttributeTargets.All,AllowMultiple = true)]
    public class PermissionAttribute : FilterAttribute, IAuthorizationFilter
    {
        
        public PermissionAttribute(object permission)
        {
            if ((permission as System.Enum) == null)
            {
                throw new ArgumentException("Attribute must be a System.Enum.", "permission");
            }

            this.permission = (int)permission;
        }
        private readonly int permission;

        public void OnAuthorization(AuthorizationContext filterContext)
        {
            if (!filterContext.HttpContext.GetUser().HasPermission(this.permission))
            {
                filterContext.HttpContext.Response.StatusCode = 403;
                filterContext.Result = new ContentResult()
                                  {
                                      Content = "You have insufficient privileges to complete this action",
                                      ContentEncoding = Encoding.UTF8,
                                      ContentType = "text/plain"
                                  };
            }
        }
    }
}