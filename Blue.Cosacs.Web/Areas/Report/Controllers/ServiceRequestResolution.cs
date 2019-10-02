using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Generic;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class ServiceRequestResolutionController : DynamicReportController
    {
        public ServiceRequestResolutionController(IClock clock,
            IEventStore audit, Blue.Config.Settings settings)
            : base(clock, audit, settings)
        {

        }

        public override JsonResult GenericReport(string parameters)
        {
            var par = ParseParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            var dataColumnName = "Product Category";
            var resolutionColumnAllData = GetDataColumn(dataColumnName, report, true);
            var chartData = GetGraphData(resolutionColumnAllData);

            audit.LogAsync(new
            {
                parameters = par,
                chartData = chartData,
            }, EventType.ReportShow, EventCategory.Report);

            return Json(new { Report = report, ChartData = chartData }, JsonRequestBehavior.AllowGet);
        }

        private JsonResult GetGraphData(List<string> columnData)
        {
            var hasEmptyCategory = false;
            var values = new Dictionary<string, Tuple<decimal, int>>();
            var dataValues = new object[0];
            var cellCnt = 0;
            for (int i = 0; i < columnData.Count; i++)
            {
                var key = columnData[i];
                if (!hasEmptyCategory && key.Trim().Length == 0)
                    hasEmptyCategory = true; // found empty element

                if (values.ContainsKey(key))
                {
                    var tup = values[key];
                    values[key] = Tuple.Create(0m, tup.Item2 + 1);
                }
                else
                {
                    values.Add(key, Tuple.Create(0m, 1));
                }
                cellCnt += 1;
            }

            if (hasEmptyCategory)
            {
                var emptyElementsCount = 0;
                var keys = values.Keys.ToArray();
                foreach (var key in keys)
                {
                    if (key.Trim().Length > 0)
                        continue;

                    emptyElementsCount = values[key].Item2;
                    values[key] = Tuple.Create((decimal)values[key].Item2, values[key].Item2);
                    break;
                }

                // Remove empty elements from calculation total
                cellCnt -= emptyElementsCount;
            }

            if (cellCnt > 0)
            {
                var keys = values.Keys.ToArray().OrderBy(e => e);
                // Calculate percentages
                foreach (var key in keys)
                {
                    if (key.Trim().Length == 0)
                        continue; // Skip empty element

                    var val = values[key].Item2;
                    var percent = ((decimal)val) / ((decimal)cellCnt);
                    values[key] = Tuple.Create(percent, val);
                }

                var data = new List<object>();
                // Create labels
                foreach (var key in keys)
                {
                    data.Add(new
                    {
                        name = key.Trim(),
                        value = values[key].Item1,
                        label = string.Format("{0:0.00}% ({1})", values[key].Item1 * 100, values[key].Item2)
                    });
                }
                dataValues = data.ToArray();
            }

            return Json(dataValues);
        }

    }
}
