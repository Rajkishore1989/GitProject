namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net.Mime;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Helpers;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class StockMovementReportController : Controller
    {
        private readonly IStockMovementRepository stockMovementRepository;
        private readonly ILocationRepository locationRepository;

        public StockMovementReportController(IStockMovementRepository stockMovementRepository, ILocationRepository locationRepository)
        {
            this.stockMovementRepository = stockMovementRepository;
            this.locationRepository = locationRepository;
        }

        [Permission(ReportPermissionEnum.StockMovement)]
        public ActionResult Index()
        {
            return View();
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.StockMovement)]
        public ViewResult Print(string c, StockMovementQueryModel query)
        {
            var model = new StockMovementPrintModel
            {
                Results = stockMovementRepository.StockMovementReport(query)
                    .OrderBy(r => r.Location)
                    .ThenBy(r => r.ProductId)
                    .ThenBy(r => r.DateProcessedUTC.ToLocalDateTime())
                    .ThenBy(r => r.Narration)
                    .Chunk(10),
                Query = query,
                ColIndicies = c.Split(',').Select(int.Parse).ToList(),
                Location = query.LocationId.HasValue ? locationRepository.Get(query.LocationId.Value).Name : string.Empty,
            };
            return View("Print", "_Print", model);
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.StockMovement)]
        public JsonResult Search(StockMovementQueryModel query)
        {
            var model = stockMovementRepository.StockMovementReport(query);
            return new JSendResult(JSendStatus.Success, model);
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.StockMovement)]
        public FileResult Export(StockMovementQueryModel query)
        {
            var result = stockMovementRepository.StockMovementReport(query)
                .OrderBy(r => r.Location)
                .ThenBy(r => r.ProductId)
                .ThenBy(r => r.DateProcessedUTC.ToLocalDateTime());

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);

            WriteColumnHeaders(writer);

            foreach (var row in result)
            {
                WriteRows(writer, row);
            }

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("StockMovementReport({0}).csv", DateTime.Now.Ticks));
        }

        private void WriteColumnHeaders(StreamWriter writer)
        {
            writer.Write("Division,");
            writer.Write("Department,");
            writer.Write("Class,");
            writer.Write("Type,");
            writer.Write("Transaction,");
            writer.Write("Product,");
            writer.Write("Brand,");
            writer.Write("Product Tags,");
            writer.Write("Location,");
            writer.Write("Quantity,");
            writer.Write("Stock On Hand,");
            writer.Write("Date,");
            writer.Write("Date Processed,");
            writer.Write("User");
        }

        private void WriteRows(StreamWriter writer, StockMovementReportModel row)
        {
            writer.Write("\n");
            writer.Write(row.Division + ",");
            writer.Write(row.Department + ",");
            writer.Write(row.Class + ",");
            writer.Write(row.Type + ",");
            writer.Write(row.Narration + ",");
            writer.Write(row.SKU + ",");
            writer.Write(row.BrandName + ",");
            writer.Write(row.ProductTags + ",");
            writer.Write(row.Location + ",");
            writer.Write(row.Quantity + ",");
            writer.Write(row.StockLevel + ",");
            writer.Write((row.DateUTC == null ? row.Date.ToString("yyy-MMM-dd hh:mm:ss tt zz") : row.DateUTC.ToLocalDateTime().ToString("yyy-MMM-dd hh:mm:ss tt zz")) + ",");
            writer.Write(row.DateProcessedUTC.ToLocalDateTime().ToString("yyy-MMM-dd hh:mm:ss tt zz") + ",");
            writer.Write(row.User);
        }
    }
}