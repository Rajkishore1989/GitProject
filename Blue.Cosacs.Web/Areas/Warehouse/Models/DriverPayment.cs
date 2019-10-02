using System.ComponentModel.DataAnnotations;
using Blue.Cosacs.Warehouse;
using System;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class DriverPayment
    {
        public DriverPayment() 
        { 
        }
        public DriverPayment(Blue.Cosacs.Warehouse.DriverPaymentView r)
        {
            this.Id = r.Id;
            this.SendingBranch = r.SendingBranch;
            this.ReceivingBranch = r.ReceivingBranch;
            this.Value = r.Value.HasValue ? r.Value.Value : Convert.ToDecimal(0);
            this.Size = r.Size;
        }

        public int Id { get; set; }
  
        [Range(1, 99999, ErrorMessage = "Sending Branch is required")] 
        public short SendingBranch { get; set; }

        [Range(1, 99999, ErrorMessage = "Receiving Branch is required")] 
        public short ReceivingBranch { get; set; }

        [Required(ErrorMessage = "Size is required")]
        [StringLength(100, ErrorMessage = "Size is too long")]
        public string Size { get; set; }

        [Range(1, 999999, ErrorMessage = "Payment Value is required")] 
        public decimal Value { get; set; }
    }
}
