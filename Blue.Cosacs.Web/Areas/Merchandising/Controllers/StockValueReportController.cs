using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;

    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    
    public class StockValueReportController : Controller
    {
        private readonly IStockValueReportRepository stockValueRepository;

        private readonly IPeriodDataRepository periodDataRepository;

        public StockValueReportController(IStockValueReportRepository stockValue, IPeriodDataRepository periodData)
        {
            stockValueRepository = stockValue;
            periodDataRepository = periodData;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.StockValuation)]
        public ViewResult Index()
        {
            return View();
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.StockValuation)]
        public ViewResult Print(StockValueSearchModel search)
        {
            return View(new
            {
                Query = search,
                Results = stockValueRepository.GetStockValueReport(search)
            });
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.StockValuation)]
        public FileResult Export(StockValueSearchModel search)
        {
            const string FileHeader = "Location,Fascia,Hierarchy Level,Hierarchy Tag,Stock On Hand Quantity,Stock On Hand Value,Stock On Hand Sales Value";
            var file = FileHeader + "\r" + BaseImportFile<StockValueExportItem>.WriteToString(stockValueRepository.GetStockValueExport(search));
            var fileName = string.Concat("StockValuationReport", DateTime.Today.ToString(CultureInfo.InvariantCulture), ".csv");
            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.StockValuation)]
        public JSendResult Search(StockValueSearchModel model)
        {
            return new JSendResult(JSendStatus.Success, stockValueRepository.GetStockValueReport(model));
        }
    }
}