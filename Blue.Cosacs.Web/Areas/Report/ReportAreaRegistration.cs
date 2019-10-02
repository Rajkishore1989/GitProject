using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Report
{
    public class ReportAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Report";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            Common.Routing.RestfulRoutes(context.Routes, "Report/", "WeeklySummary", ControllersNamespaces, AreaName);
            Common.Routing.RestfulRoutes(context.Routes, "Report/", "DynamicReport", ControllersNamespaces, AreaName);
            Common.Routing.RestfulRoutes(
                context.Routes, "Report/", "SecondEffortSolicitation", ControllersNamespaces, AreaName);

            context.MapRoute(
                "Report_default",
                "Report/{controller}/{action}/{id}",
                new
                {
                    action = "Index",
                    id = UrlParameter.Optional
                }
            );
        }

        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Report.Controllers" };
    }
}
