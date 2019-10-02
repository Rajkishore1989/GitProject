using System;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class AllocatedStockReportDetail
    {
        public string Description { get; set; }

        public int StockOnHandQuantity { get; set; }

        public decimal StockOnHandValue { get; set; }

        public int StockAvailableQuantity { get; set; }

        public decimal StockAvailableValue { get; set; }

        public int StockAllocatedQuantity { get; set; }

        public decimal StockAllocatedValue { get; set; }

        public string ReferenceNumber { get; set; }

        public DateTime DateAllocated { get; set; }
    }
}