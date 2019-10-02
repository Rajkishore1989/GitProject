using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class PickUpConfirmation
    {

        public int Id { get; set; }
        public string Comment { get; set; }
        public string RejectedReason { get; set; }
        public string ScheduleQuantity { get; set; }
    }
}