namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    using System.Collections.Generic;

    public class AllocatedStockReportGroup
    {
        public int TotalStockOnHandQuantity { get; set; }
        public decimal TotalStockOnHandValue { get; set; }
        public int TotalStockAvailableQuantity { get; set; }
        public decimal TotalStockAvailableValue { get; set; }
        public int TotalStockAllocatedQuantity { get; set; }

        public decimal TotalStockAllocatedValue { get; set; }

        public string Sku { get; set; }

        public string LocationName { get; set; }

        public int ProductId { get; set; }

        public int LocationId { get; set; }

        public List<AllocatedStockReportDetail> Details { get; set; }
    }
}