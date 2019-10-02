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
    public class ServiceIncomeAnalysisController : DynamicReportController
    {
        //    

        public ServiceIncomeAnalysisController(IEventStore audit, Blue.Config.Settings settings,
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
                RemoveDataColumn("CatOrder", report);
                RemoveDataColumn("PGOrder", report);
            }

            audit.LogAsync(new
            {
                parameters = par,
                fileName = fileName,
            }, EventType.ReportExport, EventCategory.Report);

            return File(report.Data.ToByteArray(), "text/plain", fileName.ToString());

            //return base.GenericReportExport(parameters, fileName);
        }
    }
}
