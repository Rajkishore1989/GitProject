using System.Web.Mvc;
using map = Blue.Cosacs.Web.Common;

namespace Blue.Cosacs.Web.Areas.Merchandising
{
    using System;
    using System.Collections.Generic;
    using System.Configuration;
    using System.Linq;
    using System.Reflection;

    using Blue.Cosacs.Merchandising.Helpers;
    using Blue.Cosacs.Web.Controllers;
    using StructureMap.TypeRules;

    public class MerchandisingAreaRegistration : AreaRegistration
    {
        private static readonly string[] ControllersNamespaces = { "Blue.Cosacs.Web.Areas.Merchandising.Controllers" };

        public override string AreaName
        {
            get
            {
                return "Merchandising";
            }
        }

        private static List<string> GetControllers()
        {
            return
                Assembly.GetCallingAssembly()
                    .GetTypes()
                    .Where(type => ControllersNamespaces.All(c => type.IsInNamespace(c) && type.IsSubclassOf(typeof(Controller)) && 
                        !typeof(HttpHubSubscriberController<>).IsSubclassOfRawGeneric(type)))
                    .Select(c => c.Name.ReplaceLast("Controller",string.Empty))
                    .ToList();
        }
   
        public override void RegisterArea(AreaRegistrationContext context)
        {
            var contr = GetControllers();
            contr.ForEach(
                c =>
                    {
                        map.Routing.RestfulRoutes(
                            context.Routes,
                            "Merchandising/",
                            c,
                            ControllersNamespaces,
                            this.AreaName);
                    });

            context.MapRoute(
                "Merchandising_default",
                "Merchandising/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional });
        }
    }
}
