namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class Component
    {
        public int ProductId { get; set; }
        public string Sku { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public decimal RegularPrice { get; set; }
        public decimal SetPrice { get; set; }
    }
}