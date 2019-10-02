using System;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Context = Blue.Cosacs.Warehouse.Context;
using Blue.Events;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Warehouse.Utils;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    /// <summary>
    /// create → POST   /collection
    /// read → GET   /collection[/id]
    /// update → PUT   /collection/id
    /// delete → DELETE   /collection/id
    /// </summary>
    public class PickingItemsController : Controller
    {
        public PickingItemsController(IEventStore audit)
        {
            this.audit = audit;
        }

        private readonly IEventStore audit;

        [HttpGet]
        public JsonResult Index()
        {
            return this.ByTruck(null);
        }

        [HttpGet]
        public JsonResult ByTruck(int? truckId)
        {
            using (var scope = Cosacs.Warehouse.Context.Read())
            {
                var items = from i in scope.Context.BookingPendingView
                             // this where clause matches the one in TruckPendingView
                             where i.ScheduleId == null
                               && i.TruckId.HasValue
                               && i.CurrentQuantity > 0
                               && !i.Exception
                             //&& (i.PickingRejected.HasValue && !i.PickingRejected.Value)
                             select i;

                if (truckId.HasValue)
                {
                    items = items.Where(i => i.TruckId == truckId.Value);
                }
                var result = items.Take(100).ToArray();

                //HACK!!! the JSON encoding is not working properlly so we need to remove the "
                foreach (var item in result)
                {
                    item.AddressLine1.Replace("\"", string.Empty);
                    if(item.AddressLine2 != null)
                    { 
                        item.AddressLine2.Replace("\"", string.Empty);
                    }
                }

                return Json(from i in result
                            orderby i.TruckId, i.PickingId
                            select new
                            {
                                BookingId = i.Id,
                                AssignedBy = i.PickingAssignedBy,
                                Id = i.Id,
                                PickingId = i.PickingId,
                                TruckId = i.TruckId,
                                Booking = i,
                                StockOnHand = i.StockOnHand
                            }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        [JsonOnly]
        public void Create(Booking request)
        {
            using (var scope = Cosacs.Warehouse.Context.Write())
            {
                var shipment = scope.Context.Booking.Find(request.Id);
                audit.LogAsync(new { shipment = shipment, truck = request.TruckId }, EventType.AssignBookingToTruck, EventCategory.Warehouse);
                shipment.TruckId = request.TruckId;
                shipment.PickingAssignedBy = this.UserId();
                scope.Context.SaveChanges();
                scope.Complete();
            }
        }
    }
}
