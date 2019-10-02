using System;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class PickListConfirmation
    {
        public int Id { get; set; }
        public int PickedBy { get; set; }
        public int CheckedBy { get; set; }
        public DateTime PickedOn { get; set; }
        public string Comment { get; set; }

        public PickingItemConfirmation[] PickingItems { get; set; }

        public class PickingItemConfirmation
        {
            public int Id { get; set; }
            public string Comment { get; set; }
            public string RejectedReason { get; set; }
            public string PickedQuantity { get; set; }
        }
    }
}