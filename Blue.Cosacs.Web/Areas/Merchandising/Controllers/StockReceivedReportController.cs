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

    public class StockReceivedReportController : Controller
    {
        private readonly IStockMovementRepository stockMovementRepository;
        private readonly ILocationRepository locationRepository;

        public StockReceivedReportController(IStockMovementRepository stockMovementRepository, ILocationRepository locationRepository)
        {
            this.stockMovementRepository = stockMovementRepository;
            this.locationRepository = locationRepository;
        }

        [Permission(ReportPermissionEnum.StockReceived)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.StockReceived)]
        public ViewResult Print(string c, StockReceivedQueryModel query)
        {
            var model = new StockReceivedPrintModel
            {
                Results = stockMovementRepository.StockReceivedReport(query)
                    .OrderBy(r => r.LocationId)
                    .ThenBy(r => r.Vendor)
                    .ThenBy(r => r.Location)
                    .ThenBy(r => r.DateLastReceived)
                    .Chunk(10),
                Query = query,
                ColIndicies = c.Split(',').Select(int.Parse).ToList()
            };
            return View("Print", "_Print", model);
        }

        [Permission(ReportPermissionEnum.StockReceived)]
        public JsonResult Search(StockReceivedQueryModel query)
        {
            var model = stockMovementRepository.StockReceivedReport(query);
            return new JSendResult(JSendStatus.Success, model);
        }

        [Permission(ReportPermissionEnum.StockReceived)]
        public FileResult Export(StockReceivedQueryModel query)
        {
            var result = stockMovementRepository.StockReceivedReport(query);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            BaseImportFile<StockReceivedReportModel>.WriteToStream(result, writer, true);

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("StockReceivedReport({0}).csv", DateTime.Now.Ticks));
        }
    }
}