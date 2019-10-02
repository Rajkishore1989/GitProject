using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin
{
    public class AdminAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Admin";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            Common.Routing.RestfulRoutes(context.Routes, "Admin/", "Roles", ControllersNamespaces, "Admin");
            context.MapRoute("CheckLogin", "Admin/Users/CheckLogin", new { action = "CheckLogin", controller = "Users", area = "Admin" });
            context.MapRoute("CheckLoginUpdate", "Admin/Users/CheckLoginUpdate", new
            {
                action = "CheckLoginUpdate",
                controller = "Users",
                area = "Admin"
            });

            context.MapRoute(
                "Admin_default",
                "Admin/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );
        }

        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Admin.Controllers" };
    }
}
