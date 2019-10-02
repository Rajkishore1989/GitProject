using System.Web.Mvc;
using Blue.Cosacs.Messages.Service;
using Blue.Cosacs.Service;
using Blue.Cosacs.Service.Repositories;
using Blue.Events;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class PaymentsController : Controller
    {
        public PaymentsController(IClock clock, IEventStore audit, PaymentRepository repository)
        {
            this.clock = clock;
            this.audit = audit;
            this.repository = repository;
        }

        private readonly IClock clock;
        private readonly IEventStore audit;
        private readonly PaymentRepository repository;

        [HttpGet]
        public JsonResult GetExchangeRate(string payMethod)
        {
            return Json(new CosacsRepository(clock).GetExchangeRate(payMethod),JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetCulture()
        {
            return Json( new { CurrencySymbol = System.Globalization.CultureInfo.CurrentUICulture.NumberFormat.CurrencySymbol,
                               DecimalPlaces = System.Globalization.CultureInfo.CurrentUICulture.NumberFormat.CurrencyDecimalDigits}, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public void SavePayment(ServicePayment payment)
        {
            audit.LogAsync(new { Payment = payment }, EventType.SavePayment, EventCategory.Service);
            repository.SavePayment(payment);
        }
    }
}
