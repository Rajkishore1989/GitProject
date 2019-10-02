namespace Blue.Cosacs.Web.Common
{
    using System.Web;
    using System.Configuration;
    using System.Web.Mvc;

    public class MasterOnlyAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            bool isMaster;
            if (bool.TryParse(ConfigurationManager.AppSettings["Merchandising:IsMaster"], out isMaster))
            {
                if (!isMaster)
                {
                    throw new HttpException(404, "NotFound");
                }
            }
        }
    }
}