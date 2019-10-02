using System.Web.Mvc;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class ProfileController : Controller
    {
        public ActionResult Index()
        {
            return RedirectToAction("Profile", "Users", new { id = this.GetUser().Id });
        }
    }
}
