
namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class ScheduleConfirmation
    {
        public int TruckId { get; set; }

        public ScheduleItemConfirmation[] ScheduleItems { get; set; }

        public class ScheduleItemConfirmation
        {
            public int Id { get; set; }
            public string Comment { get; set; }
            public string RejectedReason { get; set; }
            public string ScheduleQuantity { get; set; }
            public string Sequence { get; set; }
        }
    }
}