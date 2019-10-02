using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Common
{
    using System.Configuration;
    using System.Text;
    using System.Web.Mvc;

   public class BasicAuthAttribute : AuthorizeAttribute
    {
        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            if (filterContext == null)
            {
                throw new ArgumentNullException("filterContext");
            }

            string auth = filterContext.HttpContext.Request.Headers["Authorization"];
            if (!string.IsNullOrEmpty(auth))
            {
                byte[] encodedDataAsBytes = Convert.FromBase64String(auth.Replace("Basic ", string.Empty));
                string value = Encoding.ASCII.GetString(encodedDataAsBytes);
                string username = value.Substring(0, value.IndexOf(':'));
                string password = value.Substring(value.IndexOf(':') + 1);

                var authKey = ConfigurationManager.AppSettings["Merchandising:MasterAuthKey"];
                var authPass = ConfigurationManager.AppSettings["Merchandising:MasterAuthPass"];
                if (username != authKey || password != authPass)
                {
                    filterContext.Result = new HttpStatusCodeResult(401);
                }
            }
            else
            {
                if (AuthorizeCore(filterContext.HttpContext))
                {
                    HttpCachePolicyBase cachePolicy = filterContext.HttpContext.Response.Cache;
                    cachePolicy.SetProxyMaxAge(new TimeSpan(0));
                    cachePolicy.AddValidationCallback(CacheValidateHandler, null);
                }
                else
                {
                    filterContext.HttpContext.Response.Clear();
                    filterContext.HttpContext.Response.StatusDescription = "Unauthorized";
                    filterContext.HttpContext.Response.AddHeader("WWW-Authenticate", "Basic realm=\"Secure Area\"");
                    filterContext.HttpContext.Response.Write("401, please authenticate");
                    filterContext.HttpContext.Response.StatusCode = 401;
                    filterContext.Result = new EmptyResult();
                    filterContext.HttpContext.Response.End();
                }
            }
        }

        private void CacheValidateHandler(HttpContext context, object data, ref HttpValidationStatus validationStatus)
        {
            validationStatus = OnCacheAuthorization(new HttpContextWrapper(context));
        }
    }
}