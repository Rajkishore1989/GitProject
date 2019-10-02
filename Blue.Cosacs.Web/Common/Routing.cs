using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Blue.Cosacs.Web.Common
{
    public class Routing
    {
        public static void RestfulRoutes(RouteCollection routes, string prefix, string controller, string[] namespaces, string area = null)
        {
            Map(routes, prefix, controller, "Create", "", "POST", area, namespaces, false);
            Map(routes, prefix, controller, "Update", "/{id}", "PUT", area, namespaces);
            Map(routes, prefix, controller, "Delete", "/{id}", "DELETE", area, namespaces);
            Map(routes, prefix, controller, "Get", "/{id}", "GET", area, namespaces);
            AreaTokens(routes.MapRoute(prefix + '_' + controller + "_Index", prefix + controller, 
                new { action = "index", controller = controller },
                new { httpMethod = new HttpMethodConstraint("GET") }, namespaces), area);
        }

        private const string regexId = @"\d{1,10}";

        private static Route Map(RouteCollection routes, string prefix, string controller, string action, string pattern, string method, string area, 
                string[] namespaces, bool expectsId = true)
        {
            return AreaTokens(routes.MapRoute(prefix + '_' + controller + '_' + action, prefix + controller + pattern,
                new { action = action, controller = controller }, 
                expectsId ?
                (object)new { httpMethod = new HttpMethodConstraint(method), id = regexId } :
                (object)new { httpMethod = new HttpMethodConstraint(method) }, 
                namespaces), area);
        }

        private static Route AreaTokens(Route route, string area)
        {
            if (area != null)
                route.DataTokens.Add("Area", area);
            return route;
        }
    }
}