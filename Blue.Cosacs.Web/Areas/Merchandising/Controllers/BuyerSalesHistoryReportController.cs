using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;
    using System;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using System.Web.Http;

    public class BuyerSalesHistoryReportController : Controller
    {
        private readonly IBuyerSalesHistoryRepository reportRepository;

        private readonly IMerchandisingHierarchyRepository merchandisingHierarchyRepository;

        public BuyerSalesHistoryReportController(IBuyerSalesHistoryRepository reportRepo, IMerchandisingHierarchyRepository merchandisingHierarchyRepo)
        {
            reportRepository = reportRepo;
            merchandisingHierarchyRepository = merchandisingHierarchyRepo;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.BuyerSalesHistory)]
        public ActionResult Index()
        {
            return View();
        }

        [System.Web.Mvc.HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.BuyerSalesHistory)]
        [LongRunningQueries]
        public JSendResult Search(BuyerSalesHistorySearchModel search)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
            }
            var result = reportRepository.BuyerSalesHistoryReport(search);
            return new JSendResult(JSendStatus.Success, result);
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.BuyerSalesHistory)]
        [LongRunningQueries]
        public ActionResult Print(BuyerSalesHistorySearchModel search)
        {
            var model = reportRepository.BuyerSalesHistoryReport(search);
            var levels = merchandisingHierarchyRepository.GetAllLevels().ToList();
            return View(new BuyerSalesHistoryPrintModel { Query = search, Levels = levels, Products = model.Products });
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.BuyerSalesHistory)]
        [LongRunningQueries]
        public FileResult Export(BuyerSalesHistorySearchModel search)
        {
            const string FileHeader = "Sku,Description,Brand,Vendor,Stock On Order,Stock On Hand,Average Weighted Cost,Stock On Hand Cost,Cash Price,Year,April,May,June,July,August,September,October,November,December,January,February,March,Year to Date";
            var file = FileHeader + "\r" + BaseImportFile<BuyerSalesHistoryExportModel>.WriteToString(reportRepository.BuyerSalesHistoryExport(search));
            var fileName = string.Concat("BuyerSalesHistoryExport", DateTime.Today.ToString(CultureInfo.InvariantCulture), ".csv");
            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }
    }
}
