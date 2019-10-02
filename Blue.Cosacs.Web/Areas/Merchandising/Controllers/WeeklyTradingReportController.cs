using System;
using System.Text;
using System.Web.Mvc;
using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class WeeklyTradingReportController : Controller
    {
        private readonly TradingExportRepository tradingRepository;

        public WeeklyTradingReportController(TradingExportRepository tradingRepository)
        {
            this.tradingRepository = tradingRepository;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.WeeklyTrading)]
        public ActionResult Index()
        {
            return View();
        }

        [CronJob]
        [LongRunningQueries]
        [HttpGet, Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        public void CronExport()
        {
            Settings settings = new Settings();
            var data = GetExportData(null);
            var fileName = string.Concat("WeeklyTradingReportExport", DateTime.Now.ToString("dd-MM-yyyy"), ".csv");

            System.IO.File.WriteAllText(System.IO.Path.Combine(settings.FileExportDirectory.ToString(), fileName), data);
        }

        [LongRunningQueries]
        [HttpGet, Permission(Cosacs.Report.ReportPermissionEnum.WeeklyTrading)]
        public FileResult ExportData(DateTime reportDate)
        {            
            var file = GetExportData(reportDate);
            var fileName = string.Concat("WeeklyTradingReportExport", reportDate.ToString(), ".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        private string GetExportData(DateTime? reportDate)
        {
            reportDate = reportDate ?? DateTime.Now.Date;

            string fileHeader = "Report Date, " + reportDate.ToString() +
                               ",,,,,,,,," + "Daily Sales," + ",,,,," + "Week To Date Sales," + ",,,,," + "Period To Date Sales" + ",,,,," + "Year To Date Sales" +
                               System.Environment.NewLine + 
                               System.Environment.NewLine +
                               "Sort Order, Division, Department, Department Code, Class, Class Code, Location ID, Location Name, Sales Type," +
                               "Actual Value, Actual Value Last Year, Variance, Actual Gross Profit, Actual Gross Profit Last Year, Variance Gross Profit," +
                               "Actual Value, Actual Value Last Year, Variance, Actual Gross Profit, Actual Gross Profit Last Year, Variance Gross Profit," +
                               "Actual Value, Actual Value Last Year, Variance, Actual Gross Profit, Actual Gross Profit Last Year, Variance Gross Profit," +
                               "Actual Value, Actual Value Last Year, Variance, Actual Gross Profit, Actual Gross Profit Last Year, Variance Gross Profit";
            return fileHeader + "\r" + BaseImportFile<TradingExportModel>.WriteToString(tradingRepository.GetExportData(reportDate.Value));
        }
    }
}