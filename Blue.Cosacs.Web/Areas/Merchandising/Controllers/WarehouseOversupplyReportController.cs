using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Globalization;
    using System.Text;

    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;

    public class WarehouseOversupplyReportController : Controller
    {
        private readonly IWarehouseOversupplyRepository reportRepository;

        public WarehouseOversupplyReportController(IWarehouseOversupplyRepository reportRepo)
        {
            reportRepository = reportRepo;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.WarehouseOversupply)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.WarehouseOversupply)]
        public JSendResult Search(WarehouseOversupplySearchModel search)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
            }
            var result = reportRepository.WarehouseOverSupplyReport(search);
            return new JSendResult(JSendStatus.Success, result);
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.WarehouseOversupply)]
        public ActionResult Print(WarehouseOversupplySearchModel search)
        {
            var result = reportRepository.WarehouseOverSupplyReport(search);
            var model = new WarehouseOversupplyPrintModel
            {
                Query = search,
                Products = result.Products,
                Levels = result.Levels
            };
            return View("Print", model);
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.WarehouseOversupply)]
        public FileResult Export(WarehouseOversupplySearchModel search)
        {
            const string FileHeader = "Division,Department,Class,Sku,Description,Warehouse Id,Warehouse,Stock On Hand In Warehouse," + 
                "Location (without stock),Date Last Received,Stock Requisitions Pending,Locations Assigned";
            var file = FileHeader + "\r" + BaseImportFile<WarehouseOversupplyExportModel>.WriteToString(reportRepository.WarehouseOverSupplyExport(search));
            var fileName = string.Concat("WarehouseOversupplyExport", DateTime.Today.ToString(CultureInfo.InvariantCulture), ".csv");
            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }
    }
}
