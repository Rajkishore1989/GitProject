using System;
using System.Linq;
using System.Web.Mvc;
using System.Web.Routing;

namespace Blue.Cosacs.Web
{
    using System.Collections.Generic;
    using AutoMapper;
    using Blue.Cosacs.Financial.Mappers;
    using Blue.Cosacs.Merchandising.Mappers;
    using Blue.Cosacs.Web.Common;

    public class Global : System.Web.HttpApplication
    {
        private static readonly string[] ControllersNamespaces = new string[] 
        { 
            "Blue.Cosacs.Web.Controllers", 
            "Blue.Glaucous.Client.Mvc.Controllers" // NotFound controller
        };

        protected void Application_Start(Object sender, EventArgs e)
        {
            global::log4net.Config.XmlConfigurator.Configure();

            ModelBinders.Binders.Add(typeof(decimal), new DecimalModelBinder());
            ModelBinders.Binders.Add(typeof(decimal?), new NullableDecimalModelBinder());
            
            // These should be removed when migrating to a later version of MVC
            ModelBinders.Binders[typeof(IDictionary<string, string>)] = new DictionaryModelBinder<string, string>();
            ModelBinders.Binders[typeof(IDictionary<int, int>)] = new DictionaryModelBinder<int, int>();
            ModelBinders.Binders[typeof(IDictionary<int, string>)] = new DictionaryModelBinder<int, string>();
            ModelBinders.Binders[typeof(IDictionary<string, int>)] = new DictionaryModelBinder<string, int>();
            ModelBinders.Binders[typeof(Dictionary<string, string>)] = new DictionaryModelBinder<string, string>();
            ModelBinders.Binders[typeof(Dictionary<int, int>)] = new DictionaryModelBinder<int, int>();
            ModelBinders.Binders[typeof(Dictionary<int, string>)] = new DictionaryModelBinder<int, string>();
            ModelBinders.Binders[typeof(Dictionary<string, int>)] = new DictionaryModelBinder<string, int>();

            AreaRegistration.RegisterAllAreas();
            RegisterRoutes(RouteTable.Routes);
            ControllerBuilder.Current.SetControllerFactory(new Blue.Glaucous.Client.Mvc.StructureMapControllerFactory());
            MvcHandler.DisableMvcResponseHeader = true;
            var razors = System.Web.Mvc.ViewEngines.Engines.Where(engine => engine is RazorViewEngine).Cast<RazorViewEngine>();
            foreach (var razor in razors)
                AddExtension(razor, "html");

            Common.Bootstrapper.Initialize(); // StructureMap/Dependency Injection stuff

            // 401 for all actions except [Public] ones when valid authentication cookie
            GlobalFilters.Filters.Add(new Blue.Web.BrowserCompatibilityFilter());
            GlobalFilters.Filters.Add(StructureMap.ObjectFactory.Container.GetInstance<Blue.Glaucous.Client.Mvc.BlockUnauthorizedFilter>());
            GlobalFilters.Filters.Add(new Blue.Glaucous.Client.Mvc.HandleErrorFilter { Order = 1 });
            GlobalFilters.Filters.Add(new Blue.Glaucous.Client.Mvc.HandleErrorFilterPermissionException { Order = 2 });

            Mapper.Initialize(cfg =>
            {
                cfg.AddProfile<MerchandisingAutomapperProfile>();
                cfg.AddProfile<FinancialAutomapperProfile>();
            });
            //this is a hack...steve did it
            var x = new HackClass();
            x = null;
        }

        private static void AddExtension(VirtualPathProviderViewEngine engine, string extension)
        {
            var extensions = engine.FileExtensions;
            engine.FileExtensions = extensions.Append(extension);
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            //PickListsController.Routes(routes); //#11504 - Commented out conflicting with admin/picklists         //#11486
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            Artemis.Runtime.Web.FilesController.Routes(RouteTable.Routes);

            routes.MapRoute("Sitemap", "sitemap.json",
                new { controller = "Sitemap", action = "Index", id = UrlParameter.Optional }, null,
                ControllersNamespaces);

            routes.MapRoute(
                "Home", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Home", action = "Index", id = UrlParameter.Optional }, // Parameter defaults
                null,
                ControllersNamespaces // Namespaces
            );
        }
    }
}

