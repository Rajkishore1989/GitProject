using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Service
{
    public class ServiceAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Service";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            Routing.RestfulRoutes(context.Routes, "Service/", "Requests", ControllersNamespaces, "Service");
            Common.Routing.RestfulRoutes(context.Routes, "Service/", "ServiceSuppliers", ControllersNamespaces, "Service");
            Common.Routing.RestfulRoutes(context.Routes, "Service/", "Resolutions", ControllersNamespaces, "Service");

            context.MapRoute(
                "Service_default",
                "Service/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );
        }    
        
        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Service.Controllers" };
    }
}
