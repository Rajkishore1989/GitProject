using System;
using System.ComponentModel.DataAnnotations;
using Blue.Admin.Attributes.Validation;



namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class ProfileNew : Profile
    {
        public ProfileNew() { }

        [Required(ErrorMessage = "Password is required")]
        [Password]
        public string Password { get; set; }

        [Required(ErrorMessage = "Expiry is required")]
        public DateTime PasswordExpiry { get; set; }

    }
}
