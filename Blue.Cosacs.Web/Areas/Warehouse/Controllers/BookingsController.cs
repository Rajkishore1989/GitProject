using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warehouse.Repositories;
using Blue.Cosacs.Warehouse.Search;
using Blue.Cosacs.Web.Areas.Warehouse.Models;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Web.Common.Validators;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class BookingsController : Controller
    {
        public BookingsController(IClock clock, IEventStore audit, Blue.Config.Settings settings)
        {
            this.clock = clock;
            this.audit = audit;
            this.settings = settings;
        }

        private readonly IClock clock;
        private readonly IEventStore audit;
        private readonly Blue.Config.Settings settings;

        IBookingValidator validator;

        public IBookingValidator Validator
        {
            get
            {

                if (validator == null)
                    validator = new BookingValidator();

                return this.validator;
            }
            set
            {
                this.validator = value;
            }
        }

        [HttpGet]
        [Permission(WarehousePermissionEnum.BookingSearch)]
        public ActionResult Index(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpGet]
        public JsonResult ForceIndex(int[] ids = null)
        {
            audit.LogAsync(new { }, EventType.FullIndex, EventCategory.Index);
            return Json(SolrIndex.Booking(ids), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "Booking")
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: new[] { "DeliveryBranchName", "StockBranchName", "Fascia", "DelCol", "DeliveryZone", "BookingStatus" },
                    showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                   start: start,
                   rows: rows
                   );
        }

        [HttpGet]
        public JsonResult History(int id)
        {
            return Json(new BookingRepository().History(id), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(WarehousePermissionEnum.BookingSearch)]
        public ActionResult Detail(int id)
        {
            ViewBag.Id = id;
            ViewBag.CurrencySymbol = settings.CurrencySymbol;
            var retValue = new BookingRepository().BookingDetail(id).ToList();
            if (retValue.Any())
            {
                return View(retValue);
            }
            return new HttpNotFoundResult();
        }

        [HttpPost]
        //[JsonOnly]
        public void Resolve(ResolveBooking booking)
        {
            audit.LogAsync(new { booking = booking }, EventType.Resolve, EventCategory.Warehouse);
            new BookingRepository().ResolveBookings(booking.Id, booking.Date, booking.Time);
            SolrIndex.Booking(new[] { booking.Id });
        }

        [HttpPost]
        //[JsonOnly]
        public void Cancel(CancelBooking booking)
        {
            if (this.Validator.Cancel(booking))
            {
                audit.LogAsync(new { shipment = booking }, EventType.Cancel, EventCategory.Warehouse);
                new BookingRepository().CancelBookings(booking.Id, this.UserId(), booking.Notes, clock.Now);
                SolrIndex.Booking(new[] { booking.Id });
            }
            else
            {
                throw new CosacsValidationException();
            }
        }
    }
}
