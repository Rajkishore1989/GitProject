namespace Blue.Cosacs.Web.Areas.Financial.Controllers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net.Mime;
    using System.Web.Mvc;
    using Blue.Cosacs.Financial.Models;
    using Blue.Cosacs.Financial.Repositories;
    using Blue.Cosacs.Merchandising.Helpers;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class FinancialQueryReportController : Controller
    {
        private readonly IFinancialQueryRepository financialQueryRepository;
        private readonly ILocationRepository locationRepository;

        private readonly Blue.Config.Settings settings;

        public FinancialQueryReportController(IFinancialQueryRepository financialQueryRepository, ILocationRepository locationRepository, Blue.Config.Settings settings)
        {
            this.financialQueryRepository = financialQueryRepository;
            this.locationRepository = locationRepository;
            this.settings = settings;
        }

        [Permission(ReportPermissionEnum.FinancialQuery)]
        public ViewResult Index()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.FinancialQuery)]
        public ViewResult Print(FinanacialQueryQueryModel query)
        {
            var model = new FinanacialQueryPrintModel
            {
                Results = financialQueryRepository.Search(query),
                Query = query,
            };
            return View("Print", "_Print", model);
        }

        [Permission(ReportPermissionEnum.FinancialQuery)]
        public JsonResult Search(FinanacialQueryQueryModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var result = financialQueryRepository.Search(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(ReportPermissionEnum.FinancialQuery)]
        public FileResult Export(FinanacialQueryQueryModel query)
        {
            var result = financialQueryRepository.Search(query);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);

            WriteColumnHeaders(writer);

            foreach (var row in result)
            {
                WriteSalesStatistics(writer, row);
            }

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("FinancialQueryReport({0}).csv", DateTime.Now.Ticks));
        }

        private void WriteColumnHeaders(StreamWriter writer)
        {
            writer.Write("Run Number,");
            writer.Write("Account Number,");
            writer.Write("Location,");
            writer.Write("Transaction Code,");
            writer.Write("Transaction Value,");
            writer.Write("Transaction Date,");
            writer.Write("Original Transaction Id");
        }

        private void WriteSalesStatistics(StreamWriter writer, FinancialQueryViewModel row)
        {
            writer.Write("\n");
            writer.Write(row.RunNumber + ",");
            writer.Write(row.AccountNumber + ",");
            writer.Write(row.Location + ",");
            writer.Write(row.TransactionCode + ",");
            writer.Write(
                row.TransactionValue == null
                    ? string.Empty
                    : Math.Round(row.TransactionValue.Value, settings.DecimalPlaces).ToString("#." + string.Join(string.Empty, Enumerable.Repeat("0", settings.DecimalPlaces)))
                      + ",");
            writer.Write(row.TransactionDate.ToString("yyy-MM-dd") + ",");
            writer.Write(row.OriginalTransactionId);
        }
    }
}