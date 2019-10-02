using System.Web.Mvc;
using map = Blue.Cosacs.Web.Common;

namespace Blue.Cosacs.Web.Areas.Warranty
{
    public class WarrantyAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Warranty";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "Levels", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "Tags", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "Warranties", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "WarrantyAPI", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "WarrantyPrices", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "Link", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "WarrantyPromotions", ControllersNamespaces, AreaName);
            map.Routing.RestfulRoutes(context.Routes, "Warranty/", "WarrantyReturn", ControllersNamespaces, AreaName);
            context.MapRoute(
                "Warranty_default",
                "Warranty/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional },
                null,
                ControllersNamespaces
            );
        }
    
        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Warranty.Controllers" };
    }
}
