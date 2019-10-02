using Blue.Glaucous.Client.Mvc;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class LockedClientsController : Controller
    {
        private readonly Blue.Admin.IAutoLockoutManager autolockoutManager;

        public LockedClientsController(Blue.Admin.IAutoLockoutManager autolockoutManager)
        {
            this.autolockoutManager = autolockoutManager;
        }

        [HttpGet]
        [Permission(Blue.Admin.AdminPermissionEnum.ListLockedClients)]
        public ActionResult Index()
        {
            return View(autolockoutManager.LockedClients());
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.ListLockedClients)]
        public void UnlockClient(string ClientID)
        {
            autolockoutManager.UnlockClient(ClientID);
        }
    }
}
