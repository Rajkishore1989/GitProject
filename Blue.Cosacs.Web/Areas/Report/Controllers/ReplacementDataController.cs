using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Events;
using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Generic;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class ReplacementDataController : DynamicReportController
    {
        public ReplacementDataController(IEventStore audit, Blue.Config.Settings settings,
            IClock clock)
            : base(clock, audit, settings)
        {
  
        }

        public override JsonResult GenericReport(string parameters)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            audit.LogAsync(new
            {
                parameters = par,
                reportData = report.Data
            }, EventType.ReportShow, EventCategory.Report);

            return Json(new { Report = report }, JsonRequestBehavior.AllowGet);
        }

        public override FileResult GenericReportExport(string parameters, string fileName)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            if (report.Data.Count != 0)
            {
                RemoveDataColumn("Remove FYW Charge", report);
                RemoveDataColumn("Remove Supplier Charge", report);
                RemoveDataColumn("Remove EW Charge", report);
                RemoveDataColumn("Remove Internal Charge", report);
                RemoveDataColumn("Remove Total Charges", report);
                RemoveDataColumn("Remove FYW Exchange Count", report);
                RemoveDataColumn("Remove Supplier Exchange Count", report);
                RemoveDataColumn("Remove EW Exchange Count", report);
                RemoveDataColumn("Remove Internal Exchange Count", report);
                RemoveDataColumn("Remove Total Exchanges", report);
            }

            audit.LogAsync(new
            {
                parameters = par,
                fileName = fileName,
            }, EventType.ReportExport, EventCategory.Report);

            return File(report.Data.ToByteArray(), "text/plain", fileName.ToString());
        }
    }
}
