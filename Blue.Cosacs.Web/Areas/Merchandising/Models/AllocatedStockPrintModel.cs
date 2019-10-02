namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    using System.Collections.Generic;

    public class AllocatedStockPrintModel
    {
        public AllocatedStockQuery Query { get; set; }

        public List<AllocatedStockReportGroup> Results { get; set; }
    }
}