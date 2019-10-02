using System;
using System.Diagnostics;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Messages.Warehouse;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warehouse.Search;
using Blue.Cosacs.Web.Areas.Warehouse.Models;
using Blue.Cosacs.Web.Common;
using Domain = Blue.Cosacs.Warehouse;
using StructureMap;
using Blue.Events;
using Blue.Hub.Client;
using Blue.Glaucous.Client.Mvc;


namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    using Blue.Cosacs.Messages.Merchandising.BookingMessage;
    using Blue.Cosacs.Warehouse.Utils;

    public class CustomerPickUpsController : Controller
    {
        //
        // GET: /Warehouse/CustomerPickUps/

        public CustomerPickUpsController(IContainer container, IEventStore audit, IClock clock)
        {
            this.clock = clock;
            this.container = container;
            this.audit = audit;
        }

        private readonly IClock clock;
        private readonly IContainer container;      // #12215
        private readonly IEventStore audit;

        [Permission(WarehousePermissionEnum.CustomerPickup)]
        public ActionResult Print()
        {
            ViewBag.IsSummary = true;
            ViewBag.DefaultBranch = this.UserDefaultBranch();
            ViewBag.PickUpRejectListName = "Blue.Cosacs.Warehouse.PICKUPREJECT";
            ViewBag.CollectionRejectListName = "Blue.Cosacs.Warehouse.COLREJECT";
            ViewBag.ActionName = "PickUp";
            return View();
        }

        private bool IsCopy
        {
            get
            {
                return TempData.ContainsKey("IsCopy") ? (bool)TempData["IsCopy"] : true;
            }
        }

        public JsonResult ByBranch(short? branch)
        {
            using (var scope = Domain.Context.Read())
            {
                var query = scope.Context.BookingPendingView
                .Where(i =>
                    i.DeliveryBranch == branch
                    && i.PickUp == true
                    && (i.ScheduleRejected == null || i.ScheduleRejected == false)
                    && (i.DeliveryRejected == null || i.DeliveryRejected == false)
                    && i.DeliveryConfirmedBy == null
                    && i.CancelDate == null
                    && (i.Exception == null || i.Exception == false)
                   ).OrderByDescending(i => i.CustomerName).OrderByDescending(i => i.DeliveryOrCollectionDate).Take(250).ToList();      //12545 Infinite scroll - too many returned

                return Json(query, JsonRequestBehavior.AllowGet);
            }
        }


        //Method to update booking table and create partial bookings depending on the quantity being confirmed
        public JsonResult ConfirmDelivery(PickUpConfirmation confirmation)
        {
            var now = clock.UtcNow;
            var success = false;
            var isRejection = false;

            using (var scope = Domain.Context.Write())
            {
                var id = confirmation.Id;

                var bookings = (from booking in scope.Context.Booking
                                where booking.Id == confirmation.Id &&
                                (booking.ScheduleRejected == null || booking.ScheduleRejected == false) &&
                                (booking.DeliveryRejected == null || booking.DeliveryRejected == false)
                                select booking).ToList();

                // #13652 check for outstanding collections
                var pickup = (from booking in scope.Context.Booking
                              where booking.Id == confirmation.Id
                              select booking).First();

                var relatedCount = (from collect in scope.Context.Booking
                                    where
                                    collect.AcctNo == pickup.AcctNo &&
                                    collect.Id != pickup.Id &&
                                    collect.DeliveryConfirmedDate == null &&
                                    collect.DeliveryOrCollection == "C" &&
                                    collect.CurrentQuantity != 0 &&
                                    pickup.DeliveryOrCollection == "D"
                                    select collect).Count();

                if (relatedCount > 0)
                {
                    success = false;
                    scope.Complete();
                    return Json(success);
                }

                Message<WarehouseDeliver> delivered = null;

                if (bookings != null)
                {
                    //The whole booking is being rejected
                    if (!string.IsNullOrWhiteSpace(confirmation.RejectedReason) && confirmation.ScheduleQuantity == null)
                    {
                        bookings.ForEach(b =>
                            {
                                b.ScheduleRejected = !string.IsNullOrWhiteSpace(confirmation.RejectedReason);
                                b.ScheduleRejectedReason = confirmation.RejectedReason;
                                b.ScheduleComment = confirmation.Comment;
                                b.DeliveryRejected = !string.IsNullOrWhiteSpace(confirmation.RejectedReason);
                                b.DeliveryConfirmedBy = this.UserId();
                                b.DeliveryRejectedReason = confirmation.RejectedReason;
                                b.DeliverQuantity = 0;
                                b.ScheduleQuantity = 0;
                                b.DeliveryConfirmedOnDate = now;
                                b.DeliveryConfirmedDate = now;
                            });

                        isRejection = true;

                    }
                    else
                    {
                        bookings.ForEach(b =>
                        {
                            var quant = string.IsNullOrWhiteSpace(confirmation.RejectedReason) ? b.CurrentQuantity : Convert.ToInt32(confirmation.ScheduleQuantity);
                            b.ScheduleRejected = !string.IsNullOrWhiteSpace(confirmation.RejectedReason);
                            b.ScheduleRejectedReason = confirmation.RejectedReason;
                            b.ScheduleComment = confirmation.Comment;
                            b.ScheduleQuantity = quant;
                            b.DeliverQuantity = quant;
                            b.DeliveryRejected = false;
                            b.DeliveryConfirmedBy = this.UserId();
                            b.DeliveryConfirmedDate = now;
                            b.DeliveryConfirmedOnDate = now;

                            delivered = new Message<WarehouseDeliver>
                            {
                                CorrelationId = b.AcctNo,
                                Payload = new WarehouseDeliver
                                {
                                    Id = b.Id,
                                    Quantity = b.DeliverQuantity.Value,
                                    Date = now.ToLocalTime(),
                                    OrigBookingId = Convert.ToInt32(b.Path.Substring(0, b.Path.IndexOf('.'))),
                                    ConfirmedBy = this.UserId(),
                                    CustomerAccount = b.AcctNo,
                                    DeliveryOrCollection = b.DeliveryOrCollection,
                                    UnitPrice = b.UnitPrice
                                }
                            };
                        });
                    }

                    BookingException.CreateRejections(bookings, this.clock, (b) =>
                    {
                        Debug.Assert(b.ScheduleQuantity.HasValue, "We should have Schedule Quantity at this point.");
                        return (short)(b.Quantity - b.ScheduleQuantity.Value);
                    });

                    success = true;
                }

                scope.Context.SaveChanges();

                // the message is published here to be inside the transaction (writescope)
                if (delivered != null)
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

                scope.Complete();
            }
            audit.LogAsync(new { Confirmation = confirmation }, EventType.ConfirmDelivery, EventCategory.Warehouse, new { Shipment = confirmation.Id });

            SolrIndex.Booking(confirmation.Id);

            return Json(new { BookingNo = confirmation.Id, Success = success, IsRejection = isRejection });
        }

        //Method to update the ScheduledQuantity when printing. (PRINT METHOD)
        public JsonResult UpdateScheduledQuantity(int Id)
        {
            var updated = false;
            var now = clock.UtcNow;

            using (var scope = Domain.Context.Write())
            {
                var booking = scope.Context.Booking.Where(b => b.Id == Id).FirstOrDefault();

                if (booking != null)
                {
                    booking.ScheduleQuantity = booking.CurrentQuantity;
                    booking.PickUpDatePrinted = now;
                    booking.PickUpNotePrintedBy = this.UserId();

                    scope.Context.SaveChanges();

                    updated = true;

                    //#12233
                    var qtyToUpdate = booking.DeliveryOrCollection == "C" ? booking.ScheduleQuantity : -Convert.ToInt32(booking.ScheduleQuantity);
                    new UpdateStockQty() { itemId = booking.ItemId, stockLocn = booking.StockBranch, qty = qtyToUpdate }.ExecuteNonQuery();
                }
                scope.Complete();
            }

            SetIsOriginal();                  //# 11423
            SolrIndex.Booking(Id);
            audit.LogAsync(new { Id = Id }, EventType.PrintCustomerPickup, EventCategory.Warehouse);

            return Json(updated);
        }

        //Method to print the Pick Up or Return note.
        public ActionResult PrintPickUpNote(int Id)
        {
            Domain.BookingView booking;
            using (var scope = Domain.Context.Read())
            {
                booking = scope.Context.BookingView
                    .Where(b => b.Id == Id && b.ScheduleQuantity > 0).FirstOrDefault();
            }
            audit.LogAsync(new { Id = Id }, EventType.RePrintCustomerPickup, EventCategory.Warehouse, new { Shipment = Id });

            if (booking != null)
            {
                ViewBag.id = Id;
                ViewBag.BookedBy = booking.BookedBy;
                ViewBag.PickUpDatePrinted = booking.PickUpDatePrinted;
                ViewBag.loadCreatedByLogin = booking.PickUpNotePrintedBy;
                ViewBag.DeliveryBranch = booking.DeliveryBranch;
                ViewBag.User = this.UserId();
                ViewBag.UserName = this.GetUser().FullName;     // #10199
                ViewBag.IsCopy = IsCopy;
                return View("Printing/PickUpNote", booking);
            }
            else
                return View("Printing/PickUpNoteNoItems");
        }

        //# 11423
        private void SetIsOriginal()
        {
            TempData["IsCopy"] = false;
        }

    }
}
