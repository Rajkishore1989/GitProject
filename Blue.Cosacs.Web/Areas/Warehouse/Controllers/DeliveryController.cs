using Blue.Cosacs.Messages.Warehouse;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warehouse.Search;
using Blue.Cosacs.Warehouse.Utils;
using Blue.Cosacs.Web.Areas.Warehouse.Models;
using Blue.Cosacs.Web.Common;
using Blue.Events;
using Blue.Hub.Client;
using Blue.Glaucous.Client.Mvc;
using Blue.Collections.Generic;
using Blue.Cosacs.Messages.Merchandising.BookingMessage;
using StructureMap;     // #12215
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using Domain = Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class DeliveryController : Controller
    {
        public DeliveryController(IContainer container, IEventStore audit, IClock clock)
        {
            this.clock = clock;
            this.container = container;
            this.audit = audit;
        }

        private readonly IClock clock;
        private readonly IContainer container;
        private readonly IEventStore audit;

        public ActionResult Index()
        {
            ViewBag.DefaultBranch = this.UserDefaultBranch();
            ViewBag.IsSummary = true;
            return View();
        }

        [HttpGet]
        public JsonResult Items(int id)
        {
            using (var scope = Context.Read())
            {
                var query = scope.Context.PickListView
                    .Where(i =>
                        i.TruckId == id
                        && i.ScheduleId.HasValue
                        && (i.ScheduleRejected.HasValue && !i.ScheduleRejected.Value)
                    );
                return Json(query.ToList(), JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult Trucks(short? deliveryBranch = null)
        {
            using (var scope = Context.Read())
            {
                var query = scope.Context.TruckDeliveryView.AsQueryable();
                if (deliveryBranch.HasValue)
                    query = query.Where(t => t.Branch == deliveryBranch);

                return Json(query.ToArray(), JsonRequestBehavior.AllowGet);
            }
        }

        [Permission(WarehousePermissionEnum.SearchDeliverySchedules)]
        public ActionResult Search(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "Load")
        {
            //q += "AND (ItemsCount: [0 TO *])"; include those with no items 
            return new Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: new[] { "DeliveryBranchName", "Truck", "Driver", "DeliveryEmployees", "DeliveryStatus" },
                    showEmpty: false,
                    // the order that the fields appear on the search page are determined by the order of this array
                   start: start,
                   rows: rows
                   );
        }

        public JsonResult ForceIndex(int[] ids = null)
        {
            audit.LogAsync(new { Id = ids }, EventType.DeliveryIndex, EventCategory.Index);
            return Json(SolrIndex.Index(ids), JsonRequestBehavior.AllowGet);
        }

        public ActionResult PrintSchedule(int id)
        {
            using (var scope = Context.Read())
            {
                var list = scope.Context.DeliveryView//Code Added by Suvidha - CR 2018-13 - 21/12/18 - to return the AgreementInvoiceNumber.
                    .Where(b => b.ScheduleId == id && b.Quantity > 0)
                    .OrderBy(o => o.ScheduleSequence)
                    .ToList();

                var schedule = scope.Context.ScheduleView.FirstOrDefault(c => c.ScheduleID == id);

                audit.LogAsync(new { Id = id }, EventType.PrintSchedule, EventCategory.Warehouse);

                if (list.Count > 0 && schedule != null)
                {
                    ViewBag.listFirst = list.First();
                    var load = scope.Context.Load.First(l => l.Id == id);
                    var loadv = scope.Context.LoadView.First(l => l.Id == id);
                    ViewBag.load = load;
                    ViewBag.loadCreatedByName = loadv.CreatedByName;
                    ViewBag.loadCreatedByLogin = loadv.CreatedByLogin;
                    ViewBag.Vehicle = schedule.TruckName;
                    ViewBag.driver = scope.Context.Driver.FirstOrDefault(d => d.Id == load.DriverId);
                    ViewBag.id = id;
                    ViewBag.User = this.UserId();
                    ViewBag.UserName = this.GetUser().FullName;
                    ViewBag.UserLogin = this.GetUser().Login;
                    ViewBag.TotalCost = list.Sum(p => p.UnitPrice * p.Quantity);
                    ViewBag.IsCopy = IsCopy;

                    return DeliveryOrCollectionType.IsInternal(schedule.DeliveryOrCollection) ? this.View("Printing/ScheduleInternal", list) : this.View("Printing/Schedule", list);
                }

                return View("Printing/NoSchedule");
            }
        }

        private void SetIsOriginal()
        {
            TempData["IsCopy"] = false;
        }

        private bool IsCopy
        {
            get
            {
                return !TempData.ContainsKey("IsCopy") || (bool)TempData["IsCopy"];
            }
        }

        // pickingItemIds should be an ordered list of ids
        public JsonResult CreateDeliverySchedule(ScheduleConfirmation confirmation)
        {
            Domain.Load load = null;
            IEnumerable<int> shipmentId;
            int scheduleCount;

            using (var scope = Context.Write())
            {
                var truck = scope.Context.Truck.First(t => t.Id == confirmation.TruckId);

                scheduleCount = confirmation.ScheduleItems.Count(s => s.Sequence != "X");

                if (scheduleCount > 0)
                {
                    load = new Domain.Load
                    {
                        Createdby = this.UserId(),
                        CreatedOn = clock.UtcNow,
                        DriverId = truck.DriverId
                    };

                    scope.Context.Load.Add(load);
                    scope.Context.SaveChanges();
                }

                var ids = confirmation.ScheduleItems.Select(s => s.Id);

                //exclude orders that are cancelled.
                var bookings = (from shipment in scope.Context.Booking
                                join cancellation in scope.Context.Cancellation on shipment.Id equals cancellation.Id into can
                                from cancelledBookings in can.DefaultIfEmpty()
                                where shipment.ScheduleId == null &&
                                ids.Contains(shipment.Id) &&
                                  cancelledBookings.Date == null
                                select shipment).ToList();


                bookings.ForEach(b =>
                {
                    var item = confirmation.ScheduleItems.First(s => s.Id == b.Id);
                    var quant = string.IsNullOrWhiteSpace(item.RejectedReason) ? b.CurrentQuantity : Convert.ToInt32(item.ScheduleQuantity);
                    b.ScheduleId = quant > 0 || item.Sequence == "X" && load != null ? load.Id : (int?)null;
                    b.ScheduleSequence = item.Sequence == "X" ? (int?)null : Convert.ToInt32(item.Sequence);
                    b.ScheduleRejected = !string.IsNullOrWhiteSpace(item.RejectedReason);
                    b.ScheduleRejectedReason = item.RejectedReason;
                    b.ScheduleQuantity = quant;
                    b.ScheduleComment = item.Comment;
                    b.ScheduleRejectedDate = !string.IsNullOrWhiteSpace(item.RejectedReason) ? clock.UtcNow : (DateTime?)null;
                    b.ScheduleRejectedBy = !string.IsNullOrWhiteSpace(item.RejectedReason) ? this.UserId() : (int?)null;
                });

                BookingException.CreateRejections(bookings, this.clock, (b) => (short)(b.PickQuantity.Value - b.ScheduleQuantity.Value));

                shipmentId = scope.Context.Booking.Local.Select(s => s.Id);
                scope.Context.SaveChanges();
                audit.LogAsync(new
                {
                    Schedule = confirmation,
                    items = bookings.Select(b => new { b.Id, b.ScheduleId, b.ScheduleSequence, b.ScheduleQuantity, b.ScheduleRejected, b.ScheduleRejectedReason })
                }, EventCategory.Warehouse, EventType.CreateDeliverySchedule);

                // skip confirmation for internal deliveries
                var internalDeliveries = bookings.Where(b => DeliveryOrCollection.MerchandisingTypes().Contains(b.DeliveryOrCollection) && b.ScheduleId != null).ToList();

                if (internalDeliveries.Any())
                {
                    this.DelNotify(
                        new DeliveryConfirmation
                            {
                                DeliveryOn = DateTime.UtcNow,
                                Items =
                                    internalDeliveries
                                    .Select(b => new DeliveryConfirmation.Item { Id = b.BookingId, Quantity = b.ScheduleQuantity })
                                    .ToArray()
                            },
                        bookings.First().ScheduleId.Value);
                }

                scope.Context.SaveChanges();
                scope.Complete();
            }

            if (scheduleCount > 0)
            {
                SolrIndex.Index(new[] { load.Id });
            }
            if (shipmentId != null && shipmentId.Any())
            {
                SolrIndex.Booking(shipmentId.ToArray());
            }
            SetIsOriginal();
            return Json(load);
        }

        [Permission(WarehousePermissionEnum.Scheduling)]
        public ActionResult Schedule(int? id)
        {
            ViewBag.IsSummary = true;
            ViewBag.DefaultBranch = this.UserDefaultBranch();
            ViewBag.RejectListName = "Blue.Cosacs.Warehouse.LOADREJECT";
            ViewBag.ActionName = "Scheduled";
            return View();
        }

        public JsonResult ByTruck(int id, bool isInternal)
        {
            using (var scope = Domain.Context.Read())
            {
                var query =
                    scope.Context.PickListView
                    .Where(Expressions.IsInternal<PickListView>(isInternal))
                    .Where(i => 
                        i.TruckId == id
                        && (((i.ScheduleRejected == null || i.ScheduleRejected == false) && i.ScheduleId == null
                             && i.PickingRejected.HasValue
                             && (i.PickingRejected == false || (i.PickingRejected == true && i.CurrentQuantity != 0))
                             && (i.CurrentQuantity > 0 || DeliveryOrCollection.Collection.Code == i.DeliveryOrCollection)
                             && i.CancelDate == null)
                            || (i.CancelDate != null
                                && (i.CancelDate > i.LastConfirmedOn || !i.LastConfirmedOn.HasValue)
                                && i.ScheduleId == null))).ToList();
                return Json(query, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult PrintLoad(int truckId)
        {
            IList<PickListView> pickingItems;

            using (var scope = Context.Read())
            {
                pickingItems =
                    (from pi in scope.Context.PickListView
                     where
                        pi.TruckId == truckId
                        && (
                            (
                                pi.ConfirmedOn.HasValue
                                && !pi.ScheduleId.HasValue
                                && pi.PickQuantity > 0
                                && pi.CancelDate == null           // don't print cancelled items
                                && (pi.ScheduleRejected == null || pi.ScheduleRejected == false)
                                && pi.CurrentQuantity > 0
                             )
                             ||
                             (pi.CancelDate != null && (pi.CancelDate > pi.LastConfirmedOn || !pi.LastConfirmedOn.HasValue) && !pi.ScheduleId.HasValue)
                         )
                     select pi).ToList();
            }

            ViewBag.UserName = this.GetUser().FullName;
            ViewBag.DeliveryBranch = pickingItems.First().DeliveryBranch;
            ViewBag.IsCopy = false;
            ViewBag.User = this.UserId();
            audit.LogAsync(new { Truck = truckId }, EventType.PrintLoad, EventCategory.Warehouse);
            return View("Printing/Load", pickingItems);
        }


        //Method to transfer Shipments onto a different Truck
        [HttpPut]
        public void ConfirmTransfer(int currentTruckId, int newTruckId)
        {
            using (var scope = Context.Write())
            {
                var currentTruckName = scope.Context.Truck.Find(currentTruckId).Name;
                var newTruckName = scope.Context.Truck.Find(newTruckId).Name;

                //Return the Shipments on the original truck
                var bookings = scope.Context.PickListView
                .Where(i =>
                    i.TruckId == currentTruckId
                    && (((i.ScheduleRejected == null || i.ScheduleRejected == false)
                    && i.ScheduleId == null
                    && i.PickingRejected.HasValue
                    && (i.PickingRejected == false || (i.PickingRejected == true && i.CurrentQuantity != 0))
                   && (i.CurrentQuantity > 0 || DeliveryOrCollection.Collection.Code == i.DeliveryOrCollection)
                   && i.CancelDate == null)
                    || (i.CancelDate != null && i.CancelDate > i.LastConfirmedOn))
                   ).ToList();

                //Loop through each Shipment and update the TruckId to the TruckId of the new Truck to transfer to.
                bookings.ForEach(b =>
                {
                    var booking = scope.Context.Booking.Find(b.BookingId);
                    if (booking != null)
                    {
                        booking.TruckId = newTruckId;
                    }
                });

                scope.Context.SaveChanges();
                scope.Complete();
                audit.LogAsync(new { Transfered = bookings.Select(p => new { ShipmentId = p.BookingId, OriginalTruck = currentTruckName, NewTruck = newTruckName }) }, EventCategory.Warehouse, EventType.TransferTruck);
            }
        }

        #region Confirmation
        public ActionResult Confirmation(int id, DeliveryConfirmation confirmation)//Suvidha CR
        {
            //Save new;
            if (Request.HttpMethod == "POST" && ModelState.IsValid && !confirmation.Complete)
            {
                DelNotify(confirmation, id);
                return RedirectToAction("Confirmation", new
                {
                    id = id
                });
            }

            //Load new or old
            using (var scope = Context.Read())
            {
                var shipments = (from b in scope.Context.BookingView
                                 where b.ScheduleId == id
                                 orderby b.ScheduleSequence
                                 select b).ToList();

                var load = (from s in scope.Context.Load
                            where s.Id == id
                            select s).FirstOrDefault();

                //First time load
                if (confirmation.Items == null)
                {
                    confirmation = new DeliveryConfirmation
                    {
                        Id = id,
                        DeliveryOn = load.ConfirmedOn.HasValue ? load.ConfirmedOn.Value.ToLocalTime() : clock.Now,
                        ScheduleCreatedOn = load.CreatedOn.ToLocalTime().ToString(),
                        Complete = load.ConfirmedOn.HasValue,
                        DeliveryBranch = shipments.First().DeliveryBranch,
                        Items = (from b in shipments
                                 select new DeliveryConfirmation.Item
                                 {
                                     Id = b.Id,
                                     Quantity = b.Quantity,
                                     Notes = b.DeliveryRejectionNotes ?? string.Empty,
                                     RejectionReason = b.DeliveryRejectedReason == null ? string.Empty : b.DeliveryOrCollection.Equals("C") ? b.DeliveryRejectedReason.Replace("Delivery", "Collection") : b.DeliveryRejectedReason,  //#14785
                                     Booking = b//,
                                     //OrderInvoiceNo = b.OrderInvoiceNo
                                 }).ToArray()
                    };
                }
            }

            return View(confirmation);
        }

        public JsonResult ConfirmSingleShipment(int shipmentId, string confirmedDate, string rejectionReason, string rejectionNotes, int? quantity)
        {
            var shipmentQuantity = 0;
            Message<WarehouseDeliver> delivered = null;
            int? scheduleId = null;

            using (var scope = Domain.Context.Write())
            {
                var now = clock.UtcNow;
                var shipment = (from b in scope.Context.Booking
                                where b.Id == shipmentId
                                select b).FirstOrDefault();

                UpdateSingleShipment(shipment, rejectionNotes, rejectionReason, Convert.ToDateTime(confirmedDate), now, quantity);

                if (shipment.DeliverQuantity > 0)
                {
                    shipmentQuantity = shipment.DeliverQuantity ?? 0;
                    delivered = GetDeliveredMessage(shipment);
                }

                //if last order set load and schedule completed
                var notConfirmedBooking = (from b in scope.Context.Booking
                                           where b.ScheduleId == shipment.ScheduleId
                                         && !b.DeliveryConfirmedDate.HasValue && b.Id != shipment.Id
                                           select b).FirstOrDefault();

                if (notConfirmedBooking == null)
                {
                    var load = (from l in scope.Context.Load
                                where l.Id == shipment.ScheduleId
                                select l).First();

                    load.ConfirmedBy = this.UserId();
                    load.ConfirmedOn = now;

                    scheduleId = load.Id;
                }

                BookingException.CreateRejections(new[] { shipment }.ToList(), this.clock, (b) => (short)(b.ScheduleQuantity.Value - b.DeliverQuantity.Value));
                if (shipmentQuantity > 0)
                {
                    if (DeliveryOrCollection.MerchandisingTypes().Contains(delivered.Payload.DeliveryOrCollection))
                    {
                        new Mhub().Deliver(new BookingMessage
                        {
                            BookingId = delivered.Payload.OrigBookingId,
                            CurrentBookingId = delivered.Payload.Id,
                            Quantity = delivered.Payload.Quantity,
                            Type = delivered.Payload.DeliveryOrCollection,
                            AverageWeightedCost = delivered.Payload.UnitPrice
                        });
                    }
                    else
                    {
                        new Chub().Deliver(delivered);
                    }
                }

                scope.Context.SaveChanges();
                scope.Complete();

                audit.LogAsync(
                    new
                    {
                        ShipmentDeliveredOn = shipment.DeliveryConfirmedDate,
                        ShipmentConfirmedBy = shipment.DeliveryConfirmedBy,
                        ShipmentInfo = new
                        {
                            shipment.Id,
                            shipment.DeliverQuantity,
                            shipment.DeliveryRejected,
                            shipment.DeliveryRejectedReason,
                            shipment.DeliveryRejectionNotes
                        }
                    },
                    EventCategory.Warehouse,
                    EventType.ConfirmDeliveryShipment
                );
                if (scheduleId.HasValue)
                {
                    audit.LogAsync(
                        new
                        {
                            ScheduleId = shipment.ScheduleId,
                            ScheduleCompleted = "Completed",
                            ScheduleConfirmedOn = now,
                            ScheduleConfirmedBy = shipment.DeliveryConfirmedBy,
                        },
                        EventCategory.Warehouse,
                        EventType.ConfirmDeliveryShipment
                    );
                }
            }

            SolrIndex.Booking(new[] { shipmentId });
            if (scheduleId.HasValue)
            {
                SolrIndex.Index(new[] { scheduleId.Value });
            }

            return Json(new { scheduleCompleted = scheduleId.HasValue, scheduleId = scheduleId ?? -1, shipmentId }, JsonRequestBehavior.AllowGet);
        }

        private void UpdateSingleShipment(Domain.Booking shipment, string rejectionNotes, string rejectionReason, DateTime confirmedDate, DateTime now, int? quantity)
        {
            if (!shipment.DeliveryConfirmedDate.HasValue)
            {
                shipment.DeliveryConfirmedBy = this.UserId();
                shipment.DeliveryConfirmedOnDate = now;
                shipment.DeliveryConfirmedDate = Convert.ToDateTime(confirmedDate);
                shipment.DeliveryRejectionNotes = rejectionNotes;

                if (!string.IsNullOrWhiteSpace(rejectionReason))
                {
                    shipment.DeliveryRejected = true;
                    shipment.DeliveryRejectedReason = rejectionReason;
                    shipment.DeliverQuantity = quantity.HasValue ? quantity : 0;
                }
                else
                {
                    shipment.DeliveryRejected = false;
                    shipment.DeliverQuantity = shipment.CurrentQuantity;
                }
            }
        }

        private void DelNotify(DeliveryConfirmation confirmation, int id)
        {
            IEnumerable<int> shipmentIds;
            var now = clock.UtcNow;

            using (var scope = Context.Write())
            {
                var shipments = (from b in scope.Context.Booking
                                 where b.ScheduleId == id && b.DeliveryConfirmedDate == null
                                 select b).ToDictionary(k => k.Id);

                foreach (var item in confirmation.Items)
                {
                    if (!shipments.ContainsKey(item.Id))
                    {
                        continue;
                    }

                    var shipment = shipments[item.Id];
                    UpdateSingleShipment(shipment, item.Notes, item.RejectionReason, confirmation.DeliveryOn, now, item.Quantity);
                }

                var load = (from l in scope.Context.Load
                            where l.Id == id
                            select l).First();

                load.ConfirmedBy = this.UserId();
                load.ConfirmedOn = now;

                BookingException.CreateRejections(shipments.Values.ToList(), this.clock, (b) =>
                {
                    Debug.Assert(b.DeliverQuantity.HasValue, "We must have Deliver Quantity at this point.");
                    return (short)(b.ScheduleQuantity.Value - b.DeliverQuantity.Value);
                });

                shipmentIds = scope.Context.Booking.Local.Select(s => s.Id);
                scope.Context.SaveChanges();

                var delivered = shipments.Values.Where(q => q.DeliverQuantity > 0).Select(GetDeliveredMessage).ToList();

                delivered.Where(d => DeliveryOrCollection.MerchandisingTypes().Contains(d.Payload.DeliveryOrCollection)).ForEach(d =>
                    new Mhub().Deliver(new BookingMessage
                    {
                        BookingId = d.Payload.OrigBookingId,
                        CurrentBookingId = d.Payload.Id,
                        Quantity = d.Payload.Quantity,
                        Type = d.Payload.DeliveryOrCollection,
                        AverageWeightedCost = d.Payload.UnitPrice
                    }));

                new Chub().DeliverMany(delivered.Where(d => 
                    !DeliveryOrCollection.MerchandisingTypes().Contains(d.Payload.DeliveryOrCollection)));

                scope.Complete();

                audit.LogAsync(
                   new
                   {
                       ScheduleId = confirmation.Id,
                       ScheduleCompleted = "Completed",
                       ScheduleConfirmedOn = now,
                       ScheduleConfirmedBy = load.ConfirmedBy,
                       ShipmentsDeliveredOn = confirmation.DeliveryOn,
                       Shipments = shipments.Select(b => new
                       {
                           b.Value.Id,
                           b.Value.DeliverQuantity,
                           b.Value.DeliveryRejected,
                           b.Value.DeliveryRejectedReason,
                           b.Value.DeliveryRejectionNotes
                       })
                   },
                    EventCategory.Warehouse,
                    EventType.ConfirmDeliverySchedule
               );
            }
            SolrIndex.Index(new[] { id });
            if (shipmentIds != null && shipmentIds.Any())
            {
                SolrIndex.Booking(shipmentIds.ToArray());
            }

            confirmation.Complete = true;
        }

        private Message<WarehouseDeliver> GetDeliveredMessage(Blue.Cosacs.Warehouse.Booking shipment)
        {
            return new Message<WarehouseDeliver>
            {
                CorrelationId = shipment.AcctNo,
                Payload = new WarehouseDeliver
                {
                    Id = shipment.Id,
                    Quantity = shipment.DeliverQuantity.Value,
                    Date = (DateTime)shipment.DeliveryConfirmedDate,
                    OrigBookingId = Convert.ToInt32(shipment.Path.Substring(0, shipment.Path.IndexOf('.'))),
                    ConfirmedBy = this.UserId(),
                    CustomerAccount = shipment.AcctNo,
                    DeliveryOrCollection = shipment.DeliveryOrCollection,
                    UnitPrice = shipment.UnitPrice
                }
            };
        }

        #endregion
    }
}
