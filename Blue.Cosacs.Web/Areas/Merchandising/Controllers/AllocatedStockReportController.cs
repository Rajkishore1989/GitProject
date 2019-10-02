using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.IO;
    using System.Net.Mime;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Areas.Merchandising.Models;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class AllocatedStockReportController : Controller
    {
        private readonly IAllocatedStockRepository allocatedStockRepository;

        private readonly ILocationRepository locationRepository;

        public AllocatedStockReportController(IAllocatedStockRepository allocatedStockRepository, ILocationRepository locationRepository)
        {
            this.allocatedStockRepository = allocatedStockRepository;
            this.locationRepository = locationRepository;
        }

        [Permission(ReportPermissionEnum.AllocatedStock)]
        public ActionResult Index()
        {
            return this.View();
        }

         [Permission(ReportPermissionEnum.AllocatedStock)]
        public JsonResult Search(AllocatedStockQuery query)
         {
             var grouped = this.GetResults(query);

             return new JSendResult(JSendStatus.Success,grouped);
         }

        private List<AllocatedStockReportGroup> GetResults(AllocatedStockQuery query)
        {
            var results = this.allocatedStockRepository.Get(query.LocationId, query.Fascia, query.Sku, query.Tags);

            var grouped =
                results.GroupBy(r => new { r.Sku, r.LocationName, r.ProductId, r.LocationId })
                    .Select(
                        g =>
                        new AllocatedStockReportGroup
                            {
                                LocationName = g.Key.LocationName,
                                LocationId = g.Key.LocationId,
                                Sku = g.Key.Sku,
                                ProductId = g.Key.ProductId,
                                TotalStockAllocatedQuantity = g.Sum(d => d.StockAllocated.HasValue ? d.StockAllocated.Value : 0),
                                TotalStockAllocatedValue = g.Sum(d => d.StockAllocatedValue.GetValueOrDefault(0)),
                                TotalStockAvailableQuantity = g.First().StockAvailable,
                                TotalStockAvailableValue = g.First().StockAvailableValue.GetValueOrDefault(0),
                                TotalStockOnHandQuantity = g.First().StockOnHand,
                                TotalStockOnHandValue = g.First().StockOnHandValue.GetValueOrDefault(0),
                                Details =
                                    g.Select(
                                        d =>
                                        new AllocatedStockReportDetail
                                            {
                                                Description = d.LongDescription,
                                                ReferenceNumber = d.Reference,
                                                StockAllocatedQuantity = d.StockAllocated.HasValue ? d.StockAllocated.Value : 0,
                                                StockAllocatedValue = d.StockAllocatedValue.GetValueOrDefault(0),
                                                StockAvailableQuantity = d.StockAvailable,
                                                StockAvailableValue = d.StockAvailableValue.GetValueOrDefault(0),
                                                StockOnHandQuantity = d.StockOnHand,
                                                StockOnHandValue = d.StockOnHandValue.GetValueOrDefault(0),
                                                DateAllocated = d.DateAllocated
                                            }).ToList()
                            })
                    .ToList();
            return grouped;
        }

        [HttpPost, Permission(ReportPermissionEnum.AllocatedStock)]
        public ActionResult Print(AllocatedStockQuery search)
        {
            if (search.LocationId.HasValue)
            {
                search.LocationName = locationRepository.Get(search.LocationId.Value).Name;
            }

            return View(new AllocatedStockPrintModel { Query = search, Results = GetResults(search) });
        }

        [HttpPost, Permission(ReportPermissionEnum.AllocatedStock)]
        public FileResult Export(AllocatedStockQuery search)
        {
            var results = allocatedStockRepository.Get(search.LocationId, search.Fascia, search.Sku, search.Tags);

             var stream = new MemoryStream();
             var writer = new StreamWriter(stream);
             WriteColumnHeaders(writer);

             foreach (var row in results)
             {
                 WriteSalesStatistics(writer, row);
             }

             writer.Flush();
             stream.Seek(0, SeekOrigin.Begin);
             return File(stream, MediaTypeNames.Application.Octet, string.Format("AllocatedStockReport({0}).csv", DateTime.Now.Ticks));
         }

         private void WriteColumnHeaders(StreamWriter writer)
         {
             writer.Write("Sku,");
             writer.Write("Description,");
             writer.Write("Location,");
             writer.Write("Stock On Hand Quantity,");
             writer.Write("Stock On Hand Value,");
             writer.Write("Stock Available Quantity,");
             writer.Write("Stock Available Value,");
             writer.Write("Stock Allocated Quantity,");
             writer.Write("Stock Allocated Value,");
             writer.Write("Reference Number,");
             writer.Write("Date Allocated");
         }

         private void WriteSalesStatistics(StreamWriter writer, AllocatedStockView row)
         {
             writer.Write("\n");
             writer.Write(row.Sku + ",");
             writer.Write(row.LongDescription + ",");
             writer.Write(row.LocationName + ",");
             writer.Write(row.StockOnHand+ ",");
             writer.Write(row.StockOnHandValue+ ",");
             writer.Write(row.StockAvailable + ",");
             writer.Write(row.StockAvailableValue + ",");
             writer.Write(row.StockAllocated+ ",");
             writer.Write(row.StockAllocatedValue+ ",");
             writer.Write(row.Reference + ",");
             writer.Write(row.DateAllocated.ToLocalTime().ToString("dd MMM yyyy"));
         }
    }
}