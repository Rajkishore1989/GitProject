using System.ComponentModel.DataAnnotations;

namespace Blue.Cosacs.Web.Areas.Service.Models
{
    public class ServiceSupplier
    {
        public ServiceSupplier() { }
        public ServiceSupplier(Blue.Cosacs.Service.ServiceSupplier r)
        {
            this.Id = r.Id;
            this.Supplier = r.Supplier;
        }

        public int Id { get; set; }

        [Required(ErrorMessage = "Supplier is required")]
        [StringLength(20, ErrorMessage = "Supplier name is too long")]
        public string Supplier { get; set; }
    }
}
