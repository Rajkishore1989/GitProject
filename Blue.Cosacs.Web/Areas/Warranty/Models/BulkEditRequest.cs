using Blue.Cosacs.Warranty.Model;

namespace Blue.Cosacs.Web.Areas.Warranty.Models
{
    public class BulkEditRequest
    {
        public string Filter { get; set; }
        public WarrantyEditRequest EditRequest { get; set; }
    }
}