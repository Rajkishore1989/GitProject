using System.ComponentModel.DataAnnotations;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class Role
    {
        public Role() { }
        public Role(Blue.Admin.Role r)
        {
            this.Id = r.Id;
            this.Name = r.Name;
        }

        public int Id { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [StringLength(50, ErrorMessage = "Name is too long")]
        public string Name { get; set; }
    }
}