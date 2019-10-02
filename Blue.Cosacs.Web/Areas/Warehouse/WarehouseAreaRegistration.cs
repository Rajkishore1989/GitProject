using System.Web.Mvc;
using System.Web.Routing;

namespace Blue.Cosacs.Web.Areas.Warehouse
{
    public class WarehouseAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Warehouse";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            Common.Routing.RestfulRoutes(context.Routes, "Warehouse/", "PickingItems", ControllersNamespaces, "Warehouse");
            Common.Routing.RestfulRoutes(context.Routes, "Warehouse/", "Drivers", ControllersNamespaces, "Warehouse");
            Common.Routing.RestfulRoutes(context.Routes, "Warehouse/", "Trucks", ControllersNamespaces, "Warehouse");
            Common.Routing.RestfulRoutes(context.Routes, "Warehouse/", "DriverPayments", ControllersNamespaces, "Warehouse");

            context.MapRoute(
                "Warehouse_default",
                "Warehouse/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }, // Parameter defaults
                null,
                ControllersNamespaces // Namespaces
            );
        }

        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Warehouse.Controllers" };
    }
}
