using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Generic;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class DynamicReportController : Controller
    {
        public DynamicReportController(IClock clock, IEventStore audit, Blue.Config.Settings settings)
        {
            this.clock = clock;
            this.audit = audit;
            this.Settings = settings;
        }

        protected readonly IClock clock;
        protected readonly IEventStore audit;
        protected readonly Blue.Config.Settings Settings;

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult List()
        {
            return View();
        }

        protected Parameterization ParseParameters(string parameters)
        {
            return (Parameterization)new Newtonsoft.Json.JsonSerializer().Deserialize(new System.IO.StringReader(parameters), typeof(Parameterization));
        }

        public virtual FileResult GenericReportExport(string parameters, string fileName)
        {
            var par = ParseParameters(parameters);
            var report = GenericReportLoader.GetReport(par);
            const string totalCount = "TotalCount";
            var totalCountIndex = 0;

            if (report.AllData.Count != 0)
            {
                totalCountIndex = report.AllData[0].IndexOf(totalCount);
            }

            if (totalCountIndex > 0)
            {
                report.AllData.ForEach(x => x.RemoveAt(totalCountIndex));
            }

            audit.LogAsync(new
            {
                parameters = par,
                fileName,
            }, EventType.ReportExport, EventCategory.Report);

            return File(report.Data.ToByteArray(), "text/plain", fileName);
        }

        public virtual JsonResult GenericReport(string parameters)
        {
            var par = ParseParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            audit.LogAsync(new
            {
                parameters = par,
            }, EventType.ReportShow, EventCategory.Report);

            return Json(
                new
                {
                    Report = report
                }, JsonRequestBehavior.AllowGet);
        }

        #region Service Request

        [Permission(Rep.ReportPermissionEnum.TechnicianCancellations)]
        public ViewResult TechnicianRejections()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.ServiceRqResolution)]
        public ActionResult ServiceRequestResolution()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.CustomerFeedbackHappy)]
        public ActionResult CustomerFeedbackHappyCall()
        {
            return View();
        }

        public ViewResult OutstandingServiceRequests()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.SpareParts)]
        public ActionResult SpareParts()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.ServiceFailures)]
        public ActionResult ServiceFailures()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.ReplacementData)]
        public ActionResult ReplacementData()
        {
            return View();
        }


        [Permission(Rep.ReportPermissionEnum.ResolutionTimesProductCategory)]
        public ActionResult ResolutionTimesProductCategory()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.ServiceIncomeAnalysis)]
        public ActionResult ServiceIncomeAnalysis()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.ServiceClaims)]
        public ActionResult ServiceClaims()
        {
            return View();
        }

        #endregion

        #region Warranties

        [Permission(ReportPermissionEnum.HitRate)]
        public ActionResult WarrantyHitRate()
        {
            return View();
        }

        public ActionResult WarrantyClaims()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.WarrantySales)]
        public ViewResult WarrantySales()
        {
            var nonCourts = Settings.NonCourtsDealerName;

            ViewBag.NonCourts = Settings.NonCourtsDealerName == string.Empty ? "Non Courts" : Settings.NonCourtsDealerName;

            return View();
        }

        [Permission(Rep.ReportPermissionEnum.WarrantiesDueRenewal)]
        public ViewResult WarrantiesDueRenewal()
        {
            var nonCourts = Settings.NonCourtsDealerName;

            ViewBag.NonCourts = Settings.NonCourtsDealerName == string.Empty ? "Non Courts" : Settings.NonCourtsDealerName;

            return View();
        }

        [Permission(Rep.ReportPermissionEnum.WarrantyReturns)]
        public ViewResult WarrantyReturns()
        {
            var nonCourts = Settings.NonCourtsDealerName;

            ViewBag.NonCourts = Settings.NonCourtsDealerName == string.Empty ? "Non Courts" : Settings.NonCourtsDealerName;

            return View();
        }

        [Permission(Rep.ReportPermissionEnum.WarrantyTransactions)]
        public ViewResult WarrantyTransactions()
        {
            return View();
        }

        [Permission(Rep.ReportPermissionEnum.SecondEffortSolicitationCandidates)]
        public ViewResult SecondEffortSolicitation()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.InstallationHitRate)]
        public ActionResult InstallationHitRate()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.ServiceRequestFinancial)]
        public ActionResult ServiceRequestFinancial()
        {
            return View();
        }

        #endregion

        #region Logistics

        [Permission(Rep.ReportPermissionEnum.DeliveryPerformanceSummary)]
        public ActionResult DeliveryPerformanceSummary()
        {
            return View();
        }

        #endregion

        #region Report Data Helpers

        protected int GetDataColumnIndex(string columnName, List<List<string>> data)
        {
            var headerIdx = -1;

            var header = data[0]
;
            for (var i = 0; i < header.Count; i++)
            {
                if (String.Equals(header[i], columnName, StringComparison.CurrentCultureIgnoreCase))
                {
                    headerIdx = i;
                    break;
                }
            }
            return headerIdx;
        }

        protected List<string> GetDataColumn(string columnName, ReportResult report, bool allData = false)
        {
            var reportData = allData ? report.AllData : report.Data;
            var headerIdx = 0;

            if (reportData.Count <= 0)
                return new List<string>();

            Rep.Xml.Column replaceColumnData = CheckForReplaceColumns(columnName, report);
            if (replaceColumnData != null)
            {
                headerIdx = GetDataColumnIndex(replaceColumnData.ColumnReplaceValue, reportData);
            }
            else
            {
                headerIdx = GetDataColumnIndex(columnName, reportData);
            }

            return GetDataColumn(headerIdx, reportData);
        }

        private static Rep.Xml.Column CheckForReplaceColumns(string columnName, ReportResult report)
        {
            Rep.Xml.Column replaceColumnData = null;

            if (report.ReplaceColumns != null)
            {
                replaceColumnData = report.ReplaceColumns.FirstOrDefault(e => e.ColumnName.ToLower() == columnName.ToLower());
            }

            return replaceColumnData;
        }

        private List<string> GetDataColumn(int columnIndex, List<List<string>> data)
        {
            var columnData = new List<string>();

            if (columnIndex >= 0)
            {
                for (int i = 1; i < data.Count; i++)
                {
                    if (data[i].Count > columnIndex)
                        columnData.Add(data[i][columnIndex]);
                }
            }

            return columnData;
        }

        protected ReportResult RemoveDataColumn(string columnName, ReportResult report)
        {
            var headerIdx = GetDataColumnIndex(columnName, report.Data);

            if (headerIdx >= 0)
            {
                var columnsData = new List<List<string>>();
                for (int i = 0; i < report.Data.Count; i++) // do data row
                {
                    columnsData.Add(new List<string>());
                    for (int j = 0; j < report.Data[i].Count; j++) // do row cells
                    {
                        if (j != headerIdx) // skip the row to remove
                        {
                            columnsData[i].Add(report.Data[i][j]);
                        }
                    }
                }

                report.Data = columnsData;
            }

            return report;
        }

        protected Parameterization GetQueryParameters(string parameters)
        {
            var param = ParseParameters(parameters);
            if (param.PageSize < 10)
                param.PageSize = 250;
            if (param.PageIndex < 0)
                param.PageIndex = 0;

            return param;
        }

        protected ReportResult AppendDataColumn(string columnName, List<decimal> dataColumn, ReportResult report,
                                                string columnFormat = "0.00", string columnPerfix = "", string columnSufix = "")
        {
            var convertedDataColumn = new List<string>();
            convertedDataColumn.Add(columnName);

            foreach (var num in dataColumn)
            {
                if (num != 0)
                {
                    convertedDataColumn.Add(columnPerfix + num.ToString(columnFormat, CultureInfo.InvariantCulture) + columnSufix);
                }
                else
                {
                    convertedDataColumn.Add("");
                }
            }

            return AppendDataColumn(convertedDataColumn, report);
        }

        private ReportResult AppendDataColumn(List<string> dataColumn, ReportResult report)
        {
            var columnsData = new List<List<string>>();
            for (int i = 0; i < report.Data.Count; i++)
            {
                columnsData.Add(new List<string>());

                columnsData[i].AddRange(report.Data[i]);

                if (i >= dataColumn.Count)
                {
                    continue;
                }

                columnsData[i].Add(dataColumn[i]);
            }

            report.Data = columnsData;

            return report;
        }

        #endregion
    }
}
