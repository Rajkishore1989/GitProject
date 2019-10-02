namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    using System.Collections.Generic;
    using System.ComponentModel;

    public class AllocatedStockQuery
    {
        public int? LocationId { get; set; }

        [ReadOnly(true)]
        public string LocationName { get; set; }

        public string Fascia { get; set; }

        public string Sku { get; set; }

        public List<string> Tags { get; set; }

        public string TagsList { get; set; }

        public List<int> ColIndices { get; set; }
    }
}