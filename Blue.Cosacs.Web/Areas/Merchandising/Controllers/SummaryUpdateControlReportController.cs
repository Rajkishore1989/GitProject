namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Mime;
    using System.Web.Mvc;
    using AutoMapper;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class SummaryUpdateControlReportController : Controller
    {
        private readonly ISummaryUpdateControlReportRepository summaryUpdateControlReportRepository;

        public SummaryUpdateControlReportController(ISummaryUpdateControlReportRepository summaryUpdateControlReportRepository)
        {
            this.summaryUpdateControlReportRepository = summaryUpdateControlReportRepository;
        }

        [Permission(ReportPermissionEnum.SummaryUpdateControlReport)]
        public ActionResult Index()
        {
            return View();
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.SummaryUpdateControlReport)]
        public ViewResult Print(SummaryUpdateControlReportQueryModel query)
        {
            return View("Print", "_Print");
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.SummaryUpdateControlReport)]
        public JsonResult Search(SummaryUpdateControlReportQueryModel query)
        {
            var model = summaryUpdateControlReportRepository.GetReport(query);
            return new JSendResult(JSendStatus.Success, model);
        }

        [LongRunningQueries]
        [Permission(ReportPermissionEnum.SummaryUpdateControlReport)]
        public FileResult Export(SummaryUpdateControlReportQueryModel query)
        {
            var model = summaryUpdateControlReportRepository.GetReport(query);

            var result = new List<SummaryUpdateControlReportExportModel>();
            var fromDate = query.FromDate ?? new DateTime();
            var toDate = query.ToDate ?? DateTime.Now;

            result.Add(
                new SummaryUpdateControlReportExportModel {
                    TransactionType = "Opening Inventory",
                    TransactionDate = fromDate,
                    Units = Convert.ToString(model.OpeningInventory.RegularUnits),
                    Value = Convert.ToString(model.OpeningInventory.RegularValue),
                    ProductType = "RegularStock"
                }
            );
            result.Add(
                new SummaryUpdateControlReportExportModel{
                    TransactionType = "Opening Inventory",
                    TransactionDate = fromDate,
                    Units = Convert.ToString(model.OpeningInventory.RepossessedUnits),
                    Value = Convert.ToString(model.OpeningInventory.RepossessedValue),
                    ProductType = "RepossessedStock"
                }
            );
            result.Add(
                new SummaryUpdateControlReportExportModel{
                    TransactionType = "Opening Inventory",
                    TransactionDate = fromDate,
                    Units = Convert.ToString(model.OpeningInventory.SparePartsUnits),
                    Value = Convert.ToString(model.OpeningInventory.SparePartsValue),
                    ProductType = "SparePart"
                }
            );

            var current = Mapper.Map<List<SummaryUpdateControlReportExportModel>>(model.Rows)
                .OrderBy(x => x.TransactionType)
                .ThenByDescending(x => x.TransactionDate)
                .ThenBy(x => x.Reference)
                .ToList();

            result.AddRange(current);

            var closing = new List<SummaryUpdateControlReportExportModel>();
            closing.Add(
                new SummaryUpdateControlReportExportModel {
                    TransactionType = "Closing Inventory",
                    TransactionDate = toDate,
                    Units = Convert.ToString(model.ClosingInventory.RegularUnits),
                    Value = Convert.ToString(model.ClosingInventory.RegularValue),
                    ProductType = "RegularStock"
                }
            );
            closing.Add(
                new SummaryUpdateControlReportExportModel {
                    TransactionType = "Closing Inventory",
                    TransactionDate = toDate,
                    Units = Convert.ToString(model.ClosingInventory.RepossessedUnits),
                    Value = Convert.ToString(model.ClosingInventory.RepossessedValue),
                    ProductType = "RepossessedStock"
                }
            );
            closing.Add(
                new SummaryUpdateControlReportExportModel {
                    TransactionType = "Closing Inventory",
                    TransactionDate = toDate,
                    Units = Convert.ToString(model.ClosingInventory.SparePartsUnits),
                    Value = Convert.ToString(model.ClosingInventory.SparePartsValue),
                    ProductType = "SparePart"
                }
            );

            result.AddRange(closing);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            BaseImportFile<SummaryUpdateControlReportExportModel>.WriteToStream(result, writer, true);

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("SummaryUpdateControlReport({0}).csv", DateTime.Now.Ticks));
        }
    }
}