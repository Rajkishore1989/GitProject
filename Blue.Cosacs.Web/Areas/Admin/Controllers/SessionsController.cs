using Blue.Glaucous.Client.Mvc;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class SessionsController : Controller
    {
        public SessionsController(Blue.Admin.ISessionManager sessionManager)
        {
            this.sessionManager = sessionManager;
        }

        private readonly Blue.Admin.ISessionManager sessionManager;

        [HttpGet]
        [Permission(Blue.Admin.AdminPermissionEnum.ListUserSessions)]
        public ActionResult Index()
        {
            return View(sessionManager.Sessions());
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.KillUserSession)]
        public void Kill(int userId)
        {
            sessionManager.Kill(userId);
        }
    }
}
