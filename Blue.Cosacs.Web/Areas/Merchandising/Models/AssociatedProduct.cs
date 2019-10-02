using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class AssociatedProduct
    {
        public string SKU { get; set; }

        public string ShortDescription { get; set; }

        public string LongDescription { get; set; }

        public List<HierarchyValue> HierarchyValues { get; set; } 
    }
}