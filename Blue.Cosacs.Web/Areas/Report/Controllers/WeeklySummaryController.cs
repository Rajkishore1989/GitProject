using Blue.Cosacs.Web.Areas.Report.Models;
using Blue.Cosacs.Web.Common;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;
using RepService = Blue.Cosacs.Report.Service;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class WeeklySummaryController : Controller
    {
        private const string InitialFiscalYear = "datechargesstart";
        private const string FileHeader = "Week,Received,Completed,Outstanding, Average TAT,Completed Within 7 Days,7 Day %,JOBS > 20 DAYS";
        private readonly IEventStore audit;

        public WeeklySummaryController(IEventStore audit)
        {
            this.audit = audit;
        }

        [Permission(Rep.ReportPermissionEnum.WeeklySummary)]
        public ActionResult Index()
        {
            var productGroups = "";
            var currentDate = DateTime.Now.Date;
            int week = GetCurrentWeek();

            using (var scope = Common.External.Context.Read())
            {
                var categories = new[] { "PCE", "PCO", "PCF", "PCW" };

                productGroups = scope.Context.CodeCat
                        .Where(p => categories.Contains(p.category))
                        .Select(p => new
                        {
                            id = p.category,
                            text = p.catdescript
                        })
                        .ToList()
                        .ToJson();
            }

            return View(new WeeklySummary()
            {
                DefaultYear = currentDate.Year,
                ProductGroups = productGroups,
                DefaultWeek = week
            });
        }

        private int GetCurrentWeek()
        {
            int week;

            using (var scope = Common.External.Context.Read())
            {
                var currentDate = DateTime.Now.Date;

                week = (from w in scope.Context.FinancialWeeks
                        where w.StartDate <= currentDate && w.EndDate >= currentDate
                        select w.Week).SingleOrDefault();
            }

            return week == 0 ? 1 : week;
        }

        private IList<RepService.WeeklySummaryResult> Search(DateTime fiscalYearDate, int year,
                                                             int firstWeek, int lastWeek, string productGroup)
        {
            var weeklySummarySqlRunner = new RepService.WeeklySummarySqlRunner();

            return weeklySummarySqlRunner.Run(fiscalYearDate.Month, fiscalYearDate.Day, year, productGroup, firstWeek, lastWeek).ToList();
        }

        [HttpGet]
        public ActionResult Export(int year, int firstWeek, int lastWeek, string productGroup)
        {
            dynamic valid = this.ValidateSearch(year, firstWeek, lastWeek, productGroup);

            if (!valid.IsOk)
            {
                return Json(new
                {
                    valid.Result,
                    valid.Message
                }, JsonRequestBehavior.AllowGet);
            }

            var file = FileHeader + "\n" + BaseImportFile<RepService.WeeklySummaryResult>.WriteToString(Search(this.GetFiscalYearDate(), year, firstWeek, lastWeek, productGroup).ToList());

            productGroup = productGroup ?? string.Empty;
            var fileName = new StringBuilder();

            fileName.Append(DateTime.Now.ToString("yyyymmdd_"))
                .Append("WeeklySummaryController_")
                .Append("year-")
                .Append(year)
                .Append("_w1-")
                .Append(firstWeek)
                .Append("_w2-")
                .Append(lastWeek)
                .Append("_ProductGroup-")
                .Append(productGroup.Replace(new string(System.IO.Path.GetInvalidFileNameChars()), string.Empty))
                .Append(".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
        }

        private ValidationResult ValidateSearch(int year, int firstWeek, int lastWeek, string productGroup)
        {
            var returnValue = new ValidationResult();

            returnValue.Result = "ok";
            returnValue.IsOk = true;

            if (year == 0)
            {
                returnValue.Result = "error";
                returnValue.Message = "Invalid year";
                returnValue.IsOk = false;
            }

            if (firstWeek < 0 || lastWeek < 0)
            {
                returnValue.Result = "error";
                returnValue.Message = "Invalid week";
                returnValue.IsOk = false;
            }

            if (firstWeek > 52 || lastWeek > 52)
            {
                returnValue.Result = "error";
                returnValue.Message = "Invalid week";
                returnValue.IsOk = false;
            }

            if (firstWeek > lastWeek)
            {
                returnValue.Result = "error";
                returnValue.Message = "First week should be equal or greater than Second week";
                returnValue.IsOk = false;
            }

            return returnValue;
        }

        [HttpGet]
        public JsonResult Filter(int year, int firstWeek, int lastWeek, string productGroup)
        {
            var valid = this.ValidateSearch(year, firstWeek, lastWeek, productGroup);

            if (!valid.IsOk)
            {
                return Json(new
                {
                    valid.Result,
                    valid.Message
                }, JsonRequestBehavior.AllowGet);
            }

            var week = GetCurrentWeek();

            var results = Search(GetFiscalYearDate(year), year, firstWeek, lastWeek, productGroup).Select(p => p);
            var calculatePreditions = year == DateTime.Now.Year && lastWeek >= week;

            return Json(new
            {
                Result = "ok",
                data = results,
                DisplayPreditions = calculatePreditions && results.Count() > 1,
                CharData = new
                {
                    SevenDays = this.SevenDaysCharData(results, calculatePreditions),
                    Tat = this.TatCharData(results, calculatePreditions),
                    More20Days = this.More20DaysCharData(results, calculatePreditions),
                    Others = this.OthersCharData(results, calculatePreditions),
                    //AverageTimeOpen = this.AverageTimeOpemCharData(results, calculatePreditions)
                }
            }, JsonRequestBehavior.AllowGet);
        }

        private List<SevenDaysClass> SevenDaysCharData(IEnumerable<RepService.WeeklySummaryResult> source, bool calculatePreditions)
        {
            var values = source
                .Select(
                    p => new SevenDaysClass
                    {
                        Week = p.Week,
                        SevenDays = Math.Round(p.SevenDayPercentage, 2)
                    })
                .ToList();

            //get the diference from last 2 weeks, calculate the average and create 2 weeks.
            //to those 2 new week will add to to value od the last week the average value calculated
            if (values.Count > 2 && calculatePreditions)
            {
                var lastRows = values.Skip(values.Count - 3).ToList();

                lastRows.Reverse();

                var avg = lastRows.Take(2).Select((p,index) => (p.SevenDays - lastRows[index + 1].SevenDays)).Average();

                var maxWeek = values.Max(p => p.Week);
                var maxValue = values.Last().SevenDays;

                values.AddRange(Enumerable.Range(1, 2)
                    .Select(p => new SevenDaysClass
                    {
                        Week = maxWeek + p,
                        SevenDays = Math.Round(maxValue + (p * avg), 2)
                    }));
            }

            return values;
        }

        private List<Tat> TatCharData(IEnumerable<RepService.WeeklySummaryResult> source, bool calculatePreditions)
        {
            var values = source
                .Select(
                    p => new Tat { Week = p.Week, AverageTat = p.AverageTAT })
                .ToList();

            if (values.Count > 2 && calculatePreditions)
            {
                var lastRows = values.Skip(values.Count - 3).ToList();

                lastRows.Reverse();

                var avg = lastRows.Take(2).Select((p,index) => (p.AverageTat - lastRows[index + 1].AverageTat)).Average();

                var maxWeek = values.Max(p => p.Week);
                var maxValue = values.Last().AverageTat;

                values.AddRange(Enumerable.Range(1, 2)
                    .Select(p => new Tat
                    {
                        Week = maxWeek + p,
                        AverageTat = int.Parse(Math.Ceiling(Math.Round(maxValue + (p * avg), 2)).ToString())
                    }));
            }

            return values;
        }

        //private List<AverageTimeOpenClass> AverageTimeOpemCharData(IEnumerable<RepService.WeeklySummaryResult> source, bool calculatePreditions)
        //{
        //    var values = source
        //        .Select(
        //            p => new AverageTimeOpenClass { Week = p.Week, AverageTimeOpem = p.AverageTimeOpen })
        //        .ToList();

        //    if (values.Count > 1 && calculatePreditions)
        //    {
        //        var lastRows = values.Skip(values.Count - 3).ToList();

        //        lastRows.Reverse();

        //        var avg = lastRows.Take(2).Select((p, index) => (p.AverageTimeOpem - lastRows[index + 1].AverageTimeOpem)).Average();

        //        var maxWeek = values.Max(p => p.Week);
        //        var maxValue = values.Last().AverageTimeOpem;

        //        values.AddRange(Enumerable.Range(1, 2)
        //            .Select(p => new AverageTimeOpenClass
        //            {
        //                Week = maxWeek + p,
        //                AverageTimeOpem = int.Parse(Math.Ceiling(Math.Round(maxValue + (p * avg), 2)).ToString())
        //            }));
        //    }

        //    return values;
        //}

        private List<More20DaysClass> More20DaysCharData(IEnumerable<RepService.WeeklySummaryResult> source, bool calculatePreditions)
        {
            var values = source
                .Select(
                    p => new More20DaysClass { Week = p.Week, More20Days = p.JobsMore20Days })
                .ToList();

            if (values.Count > 2 && calculatePreditions)
            {
                var lastRows = values.Skip(values.Count - 3).ToList();

                lastRows.Reverse();

                var avg = lastRows.Take(2).Select((p, index) => (p.More20Days - lastRows[index + 1].More20Days)).Average();

                var maxWeek = values.Max(p => p.Week);
                var maxValue = values.Last().More20Days;

                values.AddRange(Enumerable.Range(1, 2)
                    .Select(p => new More20DaysClass
                    {
                        Week = maxWeek + p,
                        More20Days = int.Parse(Math.Ceiling(Math.Round(maxValue + (p * avg), 2)).ToString())
                    }));
            }

            return values;
        }

        private List<OthersClass> OthersCharData(IEnumerable<RepService.WeeklySummaryResult> source, bool calculatePreditions)
        {
            var values = source
                .Select(
                    p => new OthersClass
                    {
                        Week = p.Week,
                        Received = p.Received,
                        Completed = p.Completed,
                        Outstanding = p.Outstanding,
                        CompletedWithinSevenDays = p.CompletedWithin7Days
                    })
                .ToList();

            if (values.Count > 2 && calculatePreditions)
            {
                var lastRows = values.Skip(values.Count - 3).ToList();

                lastRows.Reverse();

                var avg = lastRows.Take(2).Select((p,index) => new
                {
                    Received = (p.Received - lastRows[index + 1].Received),
                    Completed = (p.Completed - lastRows[index + 1].Completed),
                    Outstanding = (p.Outstanding - lastRows[index + 1].Outstanding),
                    CompletedWithinSevenDays = (p.CompletedWithinSevenDays - lastRows[index + 1].CompletedWithinSevenDays),
                }).ToList();

                var maxWeek = values.Max(p => p.Week);
                var maxValue = values
                    .Skip(values.Count - 1)
                    .Take(1)
                    .Select(p => new
                    {
                        Received = p.Received,
                        Completed = p.Completed,
                        Outstanding = p.Outstanding,
                        CompletedWithinSevenDays = p.CompletedWithinSevenDays
                    }).First();


                values.AddRange(Enumerable.Range(1, 2)
                    .Select(p => new OthersClass
                    {
                        Week = maxWeek + p,
                        Received = int.Parse(Math.Ceiling(maxValue.Received + (p * avg.Select(val => val.Received).Average())).ToString()),
                        Completed = int.Parse(Math.Ceiling(maxValue.Completed + (p * avg.Select(val => val.Completed).Average())).ToString()),
                        Outstanding = int.Parse(Math.Ceiling(maxValue.Outstanding + (p * avg.Select(val => val.Outstanding).Average())).ToString()),
                        CompletedWithinSevenDays = int.Parse(Math.Ceiling(maxValue.CompletedWithinSevenDays + (p * avg.Select(val => val.CompletedWithinSevenDays).Average())).ToString()),
                    }));
            }

            return values;
        }

        private DateTime GetFiscalYearDate()
        {
            DateTime returnValue;

            var set = new Blue.Config.Repositories.Settings();

            if (!DateTime.TryParse(set.Get(InitialFiscalYear), out returnValue))
            {
                //was not able to parse the value so lest create a default date 
                returnValue = new DateTime(DateTime.Now.Year, 1, 1);
            }

            return returnValue;
        }

        private DateTime GetFiscalYearDate(int year)
        {
            DateTime? returnValue;

            using (var scope = Common.External.Context.Read())
            {
                returnValue = (from w in scope.Context.FinancialWeeks
                               where w.Week == 1 && w.Year == year
                               select w.StartDate).SingleOrDefault();

            }

            return returnValue.HasValue ? returnValue.Value : new DateTime(year, 1, 1);
        }

        public ActionResult DinamicReport()
        {
            return View();
        }

        public class SevenDaysClass
        {
            public int Week { get; set; }
            public double SevenDays { get; set; }
        }

        public class OthersClass
        {
            public int Week
            {
                get;
                set;
            }

            public int Received
            {
                get;
                set;
            }

            public int Completed
            {
                get;
                set;
            }

            public int Outstanding
            {
                get;
                set;
            }

            public int CompletedWithinSevenDays { get; set; }
        }

        public class More20DaysClass
        {
            public int Week
            {
                get;
                set;
            }
            public double More20Days
            {
                get;
                set;
            }
        }

        public class Tat
        {
            public int Week { get; set; }

            public int AverageTat { get; set; }
        }

        private class ValidationResult
        {
            public string Result { get; set; }
            public string Message { get; set; }
            public bool IsOk { get; set; }
        }

        //public class AverageTimeOpenClass
        //{
        //    public int Week { get; set; }

        //    public int AverageTimeOpem { get; set; }
        //}
    }
}
