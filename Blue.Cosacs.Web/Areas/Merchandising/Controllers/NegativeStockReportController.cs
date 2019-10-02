using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;

    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;

    public class NegativeStockReportController : Controller
    {
        private readonly INegativeStockRepository negativeStockRepository;

        public NegativeStockReportController(INegativeStockRepository negativeStockRepository)
        {
            this.negativeStockRepository = negativeStockRepository;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.NegativeStock)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.NegativeStock)]
        public JSendResult Search(NegativeStockSearchModel search)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
            }
            return new JSendResult(JSendStatus.Success, negativeStockRepository.GetNegativeStockReport(search));
        }

        [LongRunningQueries]
        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.NegativeStock)]
        public ActionResult Print(NegativeStockSearchModel search)
        {
            return View(
                "Print", 
                new NegativeStockPrintModel
                    {
                        Query = search,
                        Results = negativeStockRepository.GetNegativeStockExport(search)
                    });
        }

        [LongRunningQueries]
        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.NegativeStock)]
        public FileResult Export(NegativeStockSearchModel search)
        {
            const string FileHeader = "Division,Department,Class,Sku,Description,Location,Fascia,Stock On Hand Quantity,Unit Cost,Stock On Hand Value,Last Received Date," + 
                "Last Transaction Type,Last Transaction Id,Last Transaction Narration,Last Transaction Date";
            var file = FileHeader + "\r" + BaseImportFile<NegativeStockExportItem>.WriteToString(negativeStockRepository.GetNegativeStockExport(search));
            var fileName = string.Concat("NegativeStockReport", DateTime.Today.ToString(CultureInfo.InvariantCulture), ".csv");
            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }
    }
}
