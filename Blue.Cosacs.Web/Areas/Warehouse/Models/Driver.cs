using System.ComponentModel.DataAnnotations;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class Driver
    {
        public Driver() { }
        public Driver(Blue.Cosacs.Warehouse.Driver r)
        {
            this.Id = r.Id;
            this.Name = r.Name;
            this.PhoneNumber = r.PhoneNumber;
        }

        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [StringLength(50, ErrorMessage = "Name is too long")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Phone is required")]
        [StringLength(30, ErrorMessage = "Phone is too long")]
        public string PhoneNumber { get; set; }
    }
}