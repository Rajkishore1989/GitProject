using System.Collections.Generic;
using Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class PickingConfirmation
    {
        public Picking Picking { get; set; }
        public IList<BookingView> Bookings { get; set; }
    }
}