using System;
using System.Web;

namespace Blue.Cosacs.Web.Common.Validators
{
    internal class BookingValidator : IBookingValidator
    {
        public bool Cancel(Areas.Warehouse.Models.CancelBooking booking)
        {
            var returnValue = false;

            if (booking != null)
            {
                if (!string.IsNullOrEmpty(booking.Notes))
                {
                    returnValue = true;
                }
            }

            return returnValue;
        }

        public HttpRequestBase Request
        {
            get
            {
                throw new NotImplementedException();
            }
            set
            {
                throw new NotImplementedException();
            }
        }
    }
}