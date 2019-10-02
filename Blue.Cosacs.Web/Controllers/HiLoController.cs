using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class HiLoController : Controller
    {
        [HttpPost]
        public ActionResult Allocate(string sequence)
        {
            int currentHi, maxLo;
            Common.HiLo.Impl.Allocate(sequence, out currentHi, out maxLo);
            return Json(new { currentHi = currentHi, maxLo = maxLo });
        }
    }
}
