using System.ComponentModel.DataAnnotations;

namespace Blue.Cosacs.Web.Areas.Service.Models
{
    public class Resolution
    {
        public Resolution()
        {
        }
        public Resolution(Blue.Cosacs.Service.Resolution r)
        {
            this.Id = r.id;
            this.Description = r.Description;
            this.Fail = r.Fail;
        }

        public int Id
        {
            get;
            set;
        }

        [Required(ErrorMessage = "Description is required")]
        [StringLength(128, ErrorMessage = "Description is too long")]
        public string Description
        {
            get;
            set;
        }

        public bool Fail
        {
            get;
            set;
        }
    }
}