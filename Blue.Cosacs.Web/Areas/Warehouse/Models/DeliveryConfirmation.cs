using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class DeliveryConfirmation
    {
        private readonly StructureMap.IContainer container = StructureMap.ObjectFactory.Container;

        public int Id { get; set; }
        public bool Complete { get; set; }
        public short DeliveryBranch { get; set; }

        [Required(ErrorMessage = "You must enter the date when the delivery was done.")]

        [DisplayName("Delivered / Collected On")]
        [DisplayFormat(DataFormatString = "{0:dddd, d MMMM, yyyy}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Date)]
        public DateTime DeliveryOn { get; set; }

        public string ScheduleCreatedOn { get; set; }

        public Item[] Items { get; set; }

        public List<PickListRow> RejectionCodes
        {
            get
            {
                var deliveryRejectId = "Blue.Cosacs.Warehouse.DELREJECT";
                var provider = container.GetAllInstances<IPickListProvider>().Where(e => e.Id == deliveryRejectId).Single();
                var providerValues = provider.Load().Select(e => new PickListRow(e.k, e.v));
                return providerValues.ToList();
            }
        }

        public class Item
        {
            public int Id { get; set; }
            //[System.ComponentModel.DataAnnotations.MaxLength(4000)]
            public string Notes { get; set; }
            public string RejectionReason { get; set; }
            public int? Quantity { get; set; }

            //public Cosacs.Warehouse.Booking Booking { get; set; }
            public Cosacs.Warehouse.BookingView Booking { get; set; } //#10577
            //BOC Added by Suvidha - CR 2018-13 - 21/12/18 - to display the AgreementInvoiceNumber on DeliveryNote.
            public Cosacs.Warehouse.DeliveryView Delivery { get; set; }
            public string OrderInvoiceNo { get; set; }
            //BOC Added by Suvidha - CR 2018-13 - 21/12/18 - to return the AgreementInvoiceNumber on DeliveryNote.
        }
    }
}
