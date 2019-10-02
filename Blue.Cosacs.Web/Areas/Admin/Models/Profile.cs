using System;
using System.ComponentModel.DataAnnotations;
using DataAnnotationsExtensions;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
	public class Profile
	{
		public Profile() { }

		public int Id { get; set; }

		public bool Locked { get; set; }
		public string BranchName { get; set; }

		[Required(ErrorMessage = "Branch is required")]
		[Range(1, 9999, ErrorMessage = "Branch is required")]
		public short BranchNo { get; set; }

		[Required(ErrorMessage = "Login Name is required")]
		[StringLength(50, ErrorMessage = "Login Name is too long")]
        public string Login { get; set; }

		[DisplayFormat(DataFormatString = "{0:dddd, d MMMM, yyyy}", ApplyFormatInEditMode = true)]
		[DataType(DataType.Date)]
		public DateTime PasswordExpireDate { get; set; }

		[Required(ErrorMessage = "First Name is required")]
		[StringLength(50, ErrorMessage = "First Name is too long")]
		public string FirstName { get; set; }

		[Required(ErrorMessage = "Last Name is required")]
		[StringLength(50, ErrorMessage = "Last Name is too long")]
		public string LastName { get; set; }

		[StringLength(50, ErrorMessage = "External Login is too long")]
		public string ExternalLogin { get; set; }

		[StringLength(256, ErrorMessage = "Email is too long")]
		[Email]
		public string eMail { get; set; }

        [StringLength(4, ErrorMessage = "Fact Employee Id should be a maximum of four characters")]
        public string FactEmployee { get; set; }

        [StringLength(50, ErrorMessage = "Address Line 1 is too long")]
        public string AddressLine1 { get; set; }
        [StringLength(50, ErrorMessage = "Address Line 2  is too long")]
        public string AddressLine2 { get; set; }
        [StringLength(50, ErrorMessage = "Address Line 3  is too long")]
        public string AddressLine3 { get; set; }
         [StringLength(10, ErrorMessage = "PostCode is too long")]
        public string PostCode { get; set; }
         [StringLength(20, ErrorMessage = "Phone number is too long")]
        public string Phone { get; set; }
         [StringLength(20, ErrorMessage = "Phone number is too long")]
        public string PhoneAlternate { get; set; }
	}
}
