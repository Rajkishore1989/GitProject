using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Search;
using System;
using System.Collections.Generic;
using System.Linq;
using Domain = Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Common
{
    internal sealed class BookingException
    {
        public static List<Domain.Booking> CreateRejections(List<Domain.Booking> bookings, IClock clock, Func<Domain.Booking, short> newQuantity)
        {
            var bookingsList = bookings.Where(p => p.IsRejected).ToList(); //exclude the non rejected
            var returnValue = new List<Domain.Booking>();

            if (bookingsList.Count > 0)
            {
                using (var scope = Domain.Context.Write())
                {
                    var bookingID = HiLo.Cache("Warehouse.Booking");

                    foreach (var item in bookingsList)
                    {
                        var newQty = newQuantity(item);

                        if (newQty > 0)
                        {
                            var newBooking = item.Clone() as Domain.Booking;
                            newBooking.Quantity = newQty;
                            newBooking.Exception = true;
                            newBooking.Id = bookingID.NextId();
                            newBooking.Path = item.Path + String.Format("{0}.", newBooking.Id);
                            newBooking.OriginalId = item.Id;
                            newBooking.OrderedOn = clock.UtcNow;            //#11457
                            newBooking.TruckId = null;

                            newBooking.PickingAssignedBy = null;
                            newBooking.PickingAssignedDate = null;
                            newBooking.PickingComment = null;
                            newBooking.PickingId = null;
                            newBooking.PickingRejected = null;
                            newBooking.PickingRejectedReason = null;
                            newBooking.PickQuantity = null;

                            newBooking.ScheduleComment = null;
                            newBooking.ScheduleId = null;
                            newBooking.ScheduleQuantity = null;
                            newBooking.ScheduleRejected = null;
                            newBooking.ScheduleRejectedReason = null;
                            newBooking.ScheduleSequence = null;
                            newBooking.ScheduleRejectedDate = null;         //#15512
                            newBooking.ScheduleRejectedBy = null;           //#15512

                            newBooking.DeliverQuantity = null;
                            newBooking.DeliveryConfirmedBy = null;
                            newBooking.DeliveryRejected = null;
                            newBooking.DeliveryRejectedReason = null;
                            newBooking.DeliveryRejectionNotes = null;
                            newBooking.DeliveryConfirmedDate = null;

                            newBooking.PickUpDatePrinted = null;                //# 11079
                            newBooking.PickUpNotePrintedBy = null;           //# 11079

                            if (!scope.Context.Booking.Where(b => b.Path == newBooking.Path && b.OriginalId == newBooking.OriginalId).Any())
                            {
                                scope.Context.Booking.Add(newBooking);
                                returnValue.Add(newBooking);
                                var qtyToUpdate = item.DeliveryOrCollection == "D" ? newQty : -newQty;  //#12375
                                new UpdateStockQty() { itemId = item.ItemId, stockLocn = item.StockBranch, qty = qtyToUpdate }.ExecuteNonQuery();
                            }
                        }
                    }
                    scope.Context.SaveChanges();
                    scope.Complete();
                }
                var bookingIds = returnValue.Select(b => b.Id);                                          //# 11077
                if (bookingIds.Any())
                {
                    SolrIndex.Booking(bookingIds.ToArray());
                }
            }
            return returnValue;
        }
    }
}