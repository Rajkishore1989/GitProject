using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Credit
{
    public class CreditAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "Credit";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "Credit_default",
                "Credit/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional },
                null,
                ControllersNamespaces);
        }
        private static readonly string[] ControllersNamespaces = new string[] { "Blue.Cosacs.Web.Areas.Credit.Controllers" };
    }
}