namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Merchandising;

    public class ReportController : Controller
    {
        private readonly IStockValueReportRepository stockValueRepository;      
        private readonly INegativeStockRepository negativeStockRepository;
        private readonly IGoodsReceiptRepository receiptRepository;

        public ReportController(IStockValueReportRepository stockValueRepository, INegativeStockRepository negativeStockRepository, IGoodsReceiptRepository receiptRepository)
        {
            this.stockValueRepository = stockValueRepository;
            this.negativeStockRepository = negativeStockRepository;
            this.receiptRepository = receiptRepository;
        }

        [HttpGet]
        [CronJob]
        [LongRunningQueries]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        public void SummariseData()
        {
            stockValueRepository.SummariseData();
            negativeStockRepository.SummariseData();
            receiptRepository.RecreateDataForResume();
        }
    }
}
