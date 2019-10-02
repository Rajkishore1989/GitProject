using System;
using System.IO;
using System.Net.Mime;
using System.Web.Mvc;

using Blue.Cosacs.Merchandising.Helpers;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Report;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class SalesComparisonReportController : Controller
    {
        private readonly ISalesComparisonReportRepository salesComparisonReportRepository;
        private readonly ILocationRepository locationRepository;
        private readonly IBrandRepository brandRepository;

        public SalesComparisonReportController(ISalesComparisonReportRepository salesComparisonReportRepository, ILocationRepository locationRepository, IBrandRepository brandRepository)
        {
            this.salesComparisonReportRepository = salesComparisonReportRepository;
            this.locationRepository = locationRepository;
            this.brandRepository = brandRepository;
        }

        [Permission(ReportPermissionEnum.SalesComparison)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.SalesComparison)]
        [LongRunningQueries()]
        public ActionResult Search(SalesComparisonSearchModel model)
        {
            return new JSendResult(JSendStatus.Success, salesComparisonReportRepository.GroupedSalesComparisonReport(model));
        }

        [Permission(ReportPermissionEnum.SalesComparison)]
        public ViewResult Print(SalesComparisonSearchModel search)
        {
            var model = new SalesComparisonPrintModel
            {
                Results = salesComparisonReportRepository.SalesComparisonReport(search).Chunk(8),
                Query = search,
                Location = search.LocationId.HasValue ? locationRepository.Get(search.LocationId.Value).Name : string.Empty,
                Brand = search.BrandId.HasValue ? brandRepository.Get(search.BrandId.Value).BrandName : string.Empty,
            };
            return View("Print", "_Print", model);
        }

        [Permission(ReportPermissionEnum.SalesComparison)]
        public FileResult Export(SalesComparisonSearchModel search)
        {
            var result = salesComparisonReportRepository.SalesComparisonReport(search);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            WriteColumnHeaders(writer);

            foreach (var row in result)
            {
                WriteSalesStatistics(writer, row);
            }

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("SalesComparisonReport({0}).csv", DateTime.Now.Ticks));
        }

        private void WriteColumnHeaders(StreamWriter writer)
        {
            writer.Write("Division,");
            writer.Write("Department,");
            writer.Write("Class,");
            writer.Write("Sku,");
            writer.Write("Long Description,");
            writer.Write("Brand Name,");
            writer.Write("Tags,");
            writer.Write("Stock On Hand,");
            writer.Write("Stock On Order,");
            writer.Write("Stock Requested,");
            writer.Write("Current Cash Price,");
            writer.Write("Current Regular Price,");
            writer.Write("Promotional Cash Price,");
            writer.Write("Location Name,");
            writer.Write("This Year Quantity,");
            writer.Write("This Year Gross Value,");
            writer.Write("This Year Net Value,");
            writer.Write("This Year Gross Margin Value,");
            writer.Write("This Year Net Margin Value,");
            writer.Write("This Year Gross Margin Percent,");
            writer.Write("This Year Net Margin Percent,");
            writer.Write("Last Year Quantity,");
            writer.Write("Last Year Gross Value,");
            writer.Write("Last Year Net Value,");
            writer.Write("Last Year Gross Margin Value,");
            writer.Write("Last Year Net Margin Value,");
            writer.Write("Last Year Gross Margin Percent,");
            writer.Write("Last Year Net Margin Percent");
        }

        private void WriteSalesStatistics(StreamWriter writer, SalesComparisonViewModel row)
        {
            writer.Write("\n");
            writer.Write(row.Division + ",");
            writer.Write(row.Department + ",");
            writer.Write(row.Class + ",");
            writer.Write(row.Sku + ",");
            writer.Write(row.LongDescription + ",");
            writer.Write(row.BrandName + ",");
            writer.Write("\"" + row.Tags + "\",");
            writer.Write(row.StockOnHand + ",");
            writer.Write(row.StockOnOrder + ",");
            writer.Write(row.StockRequested + ",");
            writer.Write(row.CurrentCashPrice + ",");
            writer.Write(row.CurrentRegularPrice + ",");
            writer.Write(row.PromotionalCashPrice + ",");
            writer.Write(row.LocationName + ",");
            writer.Write(row.ThisYear.Quantity + ",");
            writer.Write(row.ThisYear.GrossValue + ",");
            writer.Write(row.ThisYear.NetValue + ",");
            writer.Write(row.ThisYear.GrossMarginValue + ",");
            writer.Write(row.ThisYear.NetMarginValue + ",");
            writer.Write(row.ThisYear.GrossMarginPercent + ",");
            writer.Write(row.ThisYear.NetMarginPercent + ",");
            writer.Write(row.LastYear.Quantity + ",");
            writer.Write(row.LastYear.GrossValue + ",");
            writer.Write(row.LastYear.NetValue + ",");
            writer.Write(row.LastYear.GrossMarginValue + ",");
            writer.Write(row.LastYear.NetMarginValue + ",");
            writer.Write(row.LastYear.GrossMarginPercent + ",");
            writer.Write(row.LastYear.NetMarginPercent);
        }
    }
}