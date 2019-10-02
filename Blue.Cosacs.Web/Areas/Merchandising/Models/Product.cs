namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class Product
    {
        public decimal? CostPrice { get; set; }
        public decimal? CashPrice { get; set; }
        public string ProductItemNo { get; set; }
        public string RefCodeWarrantyLink { get; set; }
        public string ItemNoWarrantyLink { get; set; }
        public string StockBranchNameWarrantyLink { get; set; }
        public short StockBranchProduct { get; set; }
        public string Id { get; set; }
        public string Type { get; set; }
        public string Level_1 { get; set; }
        public string Level_2 { get; set; }
        public string Level_3 { get; set; }
        public decimal? DutyFreePrice { get; set; }
        public double TaxRate { get; set; }
        public string Description1 { get; set; }
        public string Description2 { get; set; }
        public string VendorEAN { get; set; }
        public string Brand { get; set; }
        public string PosDescription { get; set; }
    }

    public class SolrResultProduct
    {
        public SolrResponse Response { get; set; }
    }

    public class SolrResponse
    {
        public Product[] Docs { get; set; }
    }
}