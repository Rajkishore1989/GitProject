using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Generic;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Events;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class WarrantyClaimsController : DynamicReportController
    {
        public WarrantyClaimsController(IEventStore audit, Blue.Config.Settings settings, IClock clock)
            : base(clock, audit, settings)
        {
        }

        public override JsonResult GenericReport(string parameters)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            if (report != null && report.Data.Count > 0)
            {
                report.Data = AddTotalsRow(report);

                audit.LogAsync(new
                {
                    parameters = par,
                    reportData = report.Data
                }, EventType.ReportShow, EventCategory.Report);
            }
            return Json(new { Report = report }, JsonRequestBehavior.AllowGet);
        }

        private List<List<string>> AddTotalsRow(ReportResult report)
        {
            var warrantySalePrice = GetDataColumn("Warranty Sale Price", report);
            var warrantySaleCount = GetDataColumn("Warranty Sale Count", report);
            var totalCost = GetDataColumn("Total Cost", report);
            var serviceRequestCount = GetDataColumn("Service Request Count", report);

            var warrantySalePriceTotal = CalculateColumnNumericTotal(warrantySalePrice);
            var warrantySaleCountTotal = CalculateColumnNumericTotal(warrantySaleCount);
            var totalCostTotal = CalculateColumnNumericTotal(totalCost);
            var serviceRequestCountTotal = CalculateColumnNumericTotal(serviceRequestCount);

            report.Data = CreateTotalsRow(report.Data);
            report.Data = AddTotalsRowValue("Warranty Sale Price", warrantySalePriceTotal, report.Data);
            report.Data = AddTotalsRowValue("Warranty Sale Count", warrantySaleCountTotal, report.Data, "0");
            report.Data = AddTotalsRowValue("Total Cost", totalCostTotal, report.Data);
            report.Data = AddTotalsRowValue("Service Request Count", serviceRequestCountTotal, report.Data, "0");

            return report.Data;
        }

        private List<List<string>> CreateTotalsRow(List<List<string>> report)
        {
            var totalsColumn = new List<string>(report[0].Count);
            for (int i = 0; i < report[0].Count; i++)
            {
                if (i == 0)
                    totalsColumn.Add("Totals");
                else
                    totalsColumn.Add(string.Empty);
            }
            report.Add(totalsColumn);

            return report;
        }

        private List<List<string>> AddTotalsRowValue(string columnName, decimal warrantySalePriceTotal, List<List<string>> report,
                                                     string columnFormat = "0.00", string columnPerfix = "", string columnSufix = "")
        {
            var columnIndex = GetDataColumnIndex(columnName, report);

            if (columnIndex < 0)
                return report;

            report[report.Count - 1][columnIndex] =
                columnPerfix + warrantySalePriceTotal.ToString(columnFormat, CultureInfo.InvariantCulture) + columnSufix;

            return report;
        }

        private decimal CalculateColumnNumericTotal(List<string> dataColumn)
        {
            decimal tmpTotal = 0;

            for (int i = 0; i < dataColumn.Count; i++)
            {
                decimal tmpVal = -1;

                if (decimal.TryParse(dataColumn[i], out tmpVal))
                    tmpTotal += tmpVal;
                else
                    tmpTotal += 0;
            }

            return tmpTotal;
        }

        public override FileResult GenericReportExport(string parameters, string fileName)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            audit.LogAsync(new
            {
                parameters = par,
                fileName
            }, EventType.ReportExport, EventCategory.Report);

            if (report != null)
            {
                return File(report.Data.ToByteArray(), "text/plain", fileName);
            }
            else
            {
                return File(new List<List<string>>().ToByteArray(), "text/plain", fileName);
            }
        }

    }
}