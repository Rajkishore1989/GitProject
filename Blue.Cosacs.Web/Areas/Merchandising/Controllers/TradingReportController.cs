namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class TradingReportController : Controller
    {
        private readonly ITradingReportRepository tradingReportRepository;

        public TradingReportController(ITradingReportRepository tradingReportRepository)
        {
            this.tradingReportRepository = tradingReportRepository;
        }

        [Permission(ReportPermissionEnum.Trading)]
        public ViewResult Index()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.Trading)]
        public ViewResult Print()
        {
            return View("Print", "_Print", GetViewModel(DateTime.Now.AddDays(-1)));
        }

        [Permission(ReportPermissionEnum.Trading)]
        public JsonResult Get()
        {
            return new JSendResult(JSendStatus.Success, GetViewModel(DateTime.Now.AddDays(-1)));
        }

        [Permission(ReportPermissionEnum.Trading)]
        public FileResult Csv()
        {
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            var model = GetViewModel(DateTime.Now.AddDays(-1));

            WriteColumnHeaders(writer);

            foreach (var report in model.SalesReports)
            {
                if (report.Rows != null)
                {
                    foreach (var row in report.Rows)
                    {
                        this.WriteSalesStatistics(row, writer);
                    }
                }
                this.WriteSalesStatistics(report.Totals, writer, true);
            }

            writer.Write("\n\n");

            foreach (var report in model.InventoryReports)
            {
                if (report.Rows != null)
                {
                    foreach (var row in report.Rows)
                    {
                        WriteInventoryStatistics(row, writer);
                    }
                }
                WriteInventoryStatistics(report.Totals, writer, true);
            }

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, System.Net.Mime.MediaTypeNames.Application.Octet, string.Format("TradingReport({0}).csv", DateTime.Now.Ticks));
        }

        private void WriteColumnHeaders(StreamWriter writer)
        {
            writer.Write(",");

            writer.Write("Today Sales,");
            writer.Write("Today Gross Profit,");
            writer.Write("This Week Sales,");
            writer.Write("This Week Gross Profit,");
            writer.Write("This Period Sales,");
            writer.Write("This Period Gross Profit,");
            writer.Write("This Year Sales,");
            writer.Write("This Year Gross Profit,");

            writer.Write("Today Last Year Sales,");
            writer.Write("Today Last Year Gross Profit,");
            writer.Write("This Week Last Year Sales,");
            writer.Write("This Week Last Year Gross Profit,");
            writer.Write("This Period Last Year Sales,");
            writer.Write("This Period Last Year Gross Profit,");
            writer.Write("Last Year Sales,");
            writer.Write("Last Year Gross Profit,");

            writer.Write("Variance Day Sales,");
            writer.Write("Variance Day Gross Profit,");
            writer.Write("Variance Week Sales,");
            writer.Write("Variance Week Gross Profit,");
            writer.Write("Variance Period Sales,");
            writer.Write("Variance Period Gross Profit,");
            writer.Write("Variance Year Sales,");
            writer.Write("Variance Year Gross Profit");
            
            writer.Write("\n");
        }

        private void WriteSalesStatistics(SalesStatisticsDetails row, StreamWriter writer, bool isTotal = false)
        {
            if (row == null)
            {
                return;
            }

            if (isTotal)
            {
                if (!row.IsGrandTotal)
                {
                    writer.Write("\\ ");
                }
                writer.Write("Total ");
                writer.Write(row.Name + ',');
            }
            else if (row.IsHeaderRow)
            {
                writer.Write(row.Name.ToUpper() + ',');
            }
            else
            {
                writer.Write("\\\\ ");
                writer.Write(row.Name + ',');
            }

            if (!row.IsHeaderRow && row.Statistics != null)
            {
                writer.Write(row.Statistics.TodaySales + ",");
                writer.Write(row.Statistics.TodayGrossProfit + ",");
                writer.Write(row.Statistics.ThisWeekSales + ",");
                writer.Write(row.Statistics.ThisWeekGrossProfit + ",");
                writer.Write(row.Statistics.ThisPeriodSales + ",");
                writer.Write(row.Statistics.ThisPeriodGrossProfit + ",");
                writer.Write(row.Statistics.ThisYearSales + ",");
                writer.Write(row.Statistics.ThisYearGrossProfit + ",");
                writer.Write(row.Statistics.TodayLastYearSales + ",");
                writer.Write(row.Statistics.TodayLastYearGrossProfit + ",");
                writer.Write(row.Statistics.ThisWeekLastYearSales + ",");
                writer.Write(row.Statistics.ThisWeekLastYearGrossProfit + ",");
                writer.Write(row.Statistics.ThisPeriodLastYearSales + ",");
                writer.Write(row.Statistics.ThisPeriodLastYearGrossProfit + ",");
                writer.Write(row.Statistics.LastYearSales + ",");
                writer.Write(row.Statistics.LastYearGrossProfit + ",");
                writer.Write(row.Statistics.VarianceDaySales + ",");
                writer.Write(row.Statistics.VarianceDayGrossProfit + ",");
                writer.Write(row.Statistics.VarianceWeekSales + ",");
                writer.Write(row.Statistics.VarianceWeekGrossProfit + ",");
                writer.Write(row.Statistics.VariancePeriodSales + ",");
                writer.Write(row.Statistics.VariancePeriodGrossProfit + ",");
                writer.Write(row.Statistics.VarianceYearSales + ",");
                writer.Write(row.Statistics.VarianceYearGrossProfit);
            }
            else
            {
                writer.Write(new string(',', 23));
            }
            writer.Write("\n");
        }

        private void WriteInventoryStatistics(InventoryStatisticsDetails row, StreamWriter writer, bool isTotal = false)
        {
            if (row == null)
            {
                return;
            }

            if (isTotal)
            {
                if (!row.IsGrandTotal)
                {
                    writer.Write("\\ ");
                }
                writer.Write("Total ");
                writer.Write(row.Name + ',');
            }
            else
            {
                writer.Write("\\\\ ");
                writer.Write(row.Name + ',');
            }

            if (row.Statistics != null)
            {
                writer.Write(row.Statistics.StockValue + ",");
                writer.Write(row.Statistics.StockFraction);
            }
            else
            {
                writer.Write(",");
            }
            writer.Write("\n");
        }

        private TradingReportViewModel GetViewModel(DateTime date)
        {
            // this whole thing sucks really bad
            var salesReports = new List<SalesReport>();

            var merchandiseSales = tradingReportRepository.GetMerchandiseSales(date);
            var discounts = tradingReportRepository.GetDiscounts(date);
            var warranty = tradingReportRepository.GetWarranty(date);
            var affinityProducts = tradingReportRepository.GetAffinity(date);
            var charges = tradingReportRepository.GetCharges(date);
            var accountSales = tradingReportRepository.GetMerchandisingAccountSales(date);
            var loandisbursement = new List<SalesReport> { tradingReportRepository.GetLoanDisbursement(date) };
            var inventory = tradingReportRepository.GetInventory();

            merchandiseSales.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Merchandise Sales", IsHeaderRow = true } } });
            discounts.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Discounts", IsHeaderRow = true } } });
            warranty.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Warranty", IsHeaderRow = true } } });
            affinityProducts.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Affinity", IsHeaderRow = true } } });
            charges.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Charges", IsHeaderRow = true } } });
            accountSales.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Account Sales", IsHeaderRow = true } } });
            loandisbursement.Insert(0, new SalesReport { Rows = new List<SalesStatisticsDetails> { new SalesStatisticsDetails { Name = "Loan Disbursement", IsHeaderRow = true } } });

            salesReports.AddRange(merchandiseSales);
            salesReports.AddRange(discounts);
            salesReports.AddRange(warranty);
            salesReports.AddRange(affinityProducts);
            salesReports.AddRange(charges);
            salesReports.AddRange(accountSales);
            salesReports.AddRange(loandisbursement);

            var viewModel = new TradingReportViewModel
            {
                SalesReports = salesReports,
                InventoryReports = inventory
            };
            return viewModel;
        }
    }
}