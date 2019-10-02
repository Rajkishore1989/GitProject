using System.Web.Mvc;
using map = Blue.Cosacs.Web.Common;

namespace Blue.Cosacs.Web.Areas.Stock
{
    using System;
    using System.Collections.Generic;
    using System.Configuration;
    using System.Linq;
    using System.Reflection;
    using Blue.Cosacs.Web.Controllers;
    using StructureMap.TypeRules;
    using Blue.Cosacs.Web.Common;

    public class StockAreaRegistration : AreaRegistration
    {
        private static readonly string[] ControllersNamespaces = { "Blue.Cosacs.Web.Areas.Stock.Controllers" };

        public override string AreaName
        {
            get
            {
                return "Stock";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            Routing.RestfulRoutes(context.Routes, "Stock/", "Catalogue", ControllersNamespaces, "Stock");
            context.MapRoute(
                "Stock_default",
                "Stock/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional });
        }
    }
}
