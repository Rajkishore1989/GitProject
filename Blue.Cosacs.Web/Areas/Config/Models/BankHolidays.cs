using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Blue.Cosacs.Web.Areas.Config.Models
{
    public class BankHolidays
    {
        //public IEnumerable<BankHolidays> BankHoliday { get; set; }
        [DisplayName("Calendar Year")]
        [DisplayFormat(DataFormatString = "{0:dddd, d MMMM, yyyy}", ApplyFormatInEditMode = true)]
        [DataType(DataType.Date)]
        public DateTime CalYear { get; set; }
    }

    public class BankHoliday
    {
        public DateTime Date { get; set; }
    }
}