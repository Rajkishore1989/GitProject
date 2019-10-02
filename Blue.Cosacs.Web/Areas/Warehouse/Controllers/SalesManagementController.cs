using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class SalesManagementController : Controller
    {
        [HttpGet]
        public JsonResult GetBookingAccounts(int year, short branchNo)
        {
            using (var scope = Blue.Cosacs.Warehouse.Context.Read())
            {
                var bookingAccounts = scope.Context.Booking
                    .Where(p => p.OrderedOn.Year == year &&
                           p.SalesBranch == branchNo)
                    .Select(p => new
                    {
                        AcctNo = p.AcctNo,
                        OrderedOn = p.OrderedOn,
                        DeliveryConfirmedDate = p.DeliveryConfirmedDate
                    })
                    .ToList();

                return Json(bookingAccounts, JsonRequestBehavior.AllowGet);
            }
        }
    }
}
