namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;

    public class StockMovementController : Controller
    {
        private readonly IStockCountRepository stockCountRepository;

        private readonly IStockMovementRepository stockMovementRepository;

        public StockMovementController(IStockCountRepository stockCountRepository, IStockMovementRepository stockMovementRepository )
        {
            this.stockCountRepository = stockCountRepository;
            this.stockMovementRepository = stockMovementRepository;
        }

        public ActionResult Index(string sku, int stockCountId)
        {   
           var stockCount = stockCountRepository.Get(stockCountId);

            var product = stockCountRepository.GetStockCountProduct(stockCountId, sku);
            var initalCount = product.StartStockOnHand.GetValueOrDefault(0);

            var movements = stockMovementRepository.GetStockMovements(product.ProductId, stockCount.LocationId, stockCount.StartedDate.Value, stockCount.ClosedDate ?? stockCount.CancelledDate);

            movements.ForEach(
                m =>
                    {
                        var otherMovements = movements.Where(om => om != m && om.Date < m.Date);
                        m.Total = otherMovements.Sum(om => om.Movement) + initalCount + m.Movement;
                    });

            return
                this.View(new StockMovementViewModel { 
                    LongDescription = product.LongDescription, 
                    MovementSince = stockCount.StartedDate.Value, 
                    MovementUntil = stockCount.ClosedDate ?? stockCount.CancelledDate, 
                    SKU = product.Sku, 
                    InitalCount = initalCount, 
                    Movements = movements 
                });
        }
    }
}