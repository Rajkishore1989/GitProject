using System;
using Blue.Cosacs.Merchandising.Models;

namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class PeriodData
    {
        public Period[] Periods { get; set; }
        public short Year { get; set; }

        public PeriodData()
        {
        }

        public PeriodData(PeriodYear periodData)
        {
            this.Year = periodData.year;
            this.Periods = periodData.periods;
        }

        public PeriodData(Blue.Cosacs.Merchandising.PeriodData periodData)
        {
            Period[] p = new Period[1];

            p[0] = new Period
            {
                PeriodNo = periodData.period,
                Week = periodData.week,
                StartDate = periodData.startdate?? DateTime.Now.Date,
                EndDate = periodData.enddate?? DateTime.Now.Date
            };

            this.Year = periodData.year;
            this.Periods = p;
        }
    }
}        