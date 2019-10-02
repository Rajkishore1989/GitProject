using Blue.Cosacs.Web;
using System.Web.Mvc;
using Blue.Events.Web.Models;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class AuditController : Blue.Events.Web.Controllers.EventsController
    {
        public AuditController() : base("Default") 
        {

        }

        [Permission(Blue.Admin.AdminPermissionEnum.ViewAudit)]
        public override ActionResult Index(EventSearch s)
        {
            return base.Index(s);
        }
    }
}
