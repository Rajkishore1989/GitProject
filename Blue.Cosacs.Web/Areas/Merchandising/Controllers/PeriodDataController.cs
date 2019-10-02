namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Models;
    using System.Web.Mvc;
    using System.Net;

    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class PeriodDataController : Controller
    {
        private readonly PeriodDataRepository repository;
        private readonly Settings settings;

        public PeriodDataController(PeriodDataRepository repository, Settings settings)
        {
            this.repository = repository;
            this.settings = settings;
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.PeriodDataView)]
        public ActionResult Index()
        {
            return View("Index", model: repository.GetYears().ToJson());
        }

        [HttpPost]
        [Permission(MerchandisingPermissionEnum.PeriodDataEdit)]
        public ActionResult Save(PeriodYear periodData)
        {
            if (!TryValidateModel(periodData))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
            }

            if (!repository.AreUnique(periodData))
            {
                return Json(new { Result = 0, Message = "You cannot save duplicate rows." });
            }

            return Json(new { periodData = repository.SaveData(periodData) });
        }
        
        public JSendResult GetCurrentAndPrevious()
        {
            return new JSendResult(JSendStatus.Success, repository.GetCurrentAndPreviousPeriods().ToDictionary(k => k.enddate, v => string.Format("Period {0}, {1}", v.period, v.enddate.Value.ToString(settings.DateFormat))));
        }
    }
}