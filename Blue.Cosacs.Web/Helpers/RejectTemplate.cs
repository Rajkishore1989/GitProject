
namespace Blue.Cosacs.Web.Helpers
{
    public static class RejectTemplate
    {
        public static string Rejected { get; set; }
        public static string RejectedReason { get; set; }
        public static string Comment { get; set; }
        public static string Quantity { get; set; }
        public static string OldQuantity { get; set; }
        public static string CancelDate { get; set; } //#11507

        public static void Set(string action)
        {
            switch (action)
            {
                case "Picked":
                    SetProp("PickingRejected", "PickingRejectedReason", "PickingComment", "PickQuantity", "Quantity", "CancelDate"); //#11507
                    break;
                case "Scheduled":
                    SetProp("ScheduleRejected", "ScheduleRejectedReason", "ScheduleComment", "ScheduleQuantity", "PickQuantity", "CancelDate"); //#11507
                    break;
                case "Delivery":
                    SetProp("DeliveryRejected", "DeliveryRejectedReason", "DeliveryComment", "DeliveryQuantity", "ScheduleQuantity", "CancelDate"); //#11507
                    break;
                case "PickUp":
                    SetProp("ScheduleRejected", "ScheduleRejectedReason", "ScheduleComment", "ScheduleQuantity", "Quantity", "CancelDate"); 
                    break;
            }
        }

        private static void SetProp(string rejected, string rejectedReason, string comment, string quantity, string oldQuantity, string cancelDate) //#11507
        {
            Rejected = rejected;
            RejectedReason = rejectedReason;
            Comment = comment;
            Quantity = quantity;
            OldQuantity = oldQuantity;
            CancelDate = cancelDate; //#11507
        }
    }
}