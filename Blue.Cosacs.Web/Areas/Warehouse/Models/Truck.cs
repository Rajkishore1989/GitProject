using System.ComponentModel.DataAnnotations;
using Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class Truck
    {
        public Truck() { }
        public Truck(Blue.Cosacs.Warehouse.TruckView r)
        {
                this.Id = r.Id;
                this.Name = r.Name;
                this.Branch = r.Branch;
                this.DriverId = r.DriverId;
                this.Size = r.Size;
        }

        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [StringLength(50, ErrorMessage = "Name is too long")]
        public string Name { get; set; }

        [Range(1, 99999, ErrorMessage = "Branch is required")] //#10784
        public short Branch { get; set; }

        [Required(ErrorMessage = "Driver is required")] //#10784
        public int? DriverId {get; set;}

        [Required(ErrorMessage = "Size is required")]
        [StringLength(100, ErrorMessage = "Size is too long")]
        public string Size { get; set; }

    }
}
