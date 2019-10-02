using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Blue.Admin;
using System.Text;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class BranchOpeningHoursModel
    {
        public short BranchNo
        {
            get;
            set;
        }
        public string BranchName
        {
            get;
            set;
        }
        public string MondayOpen
        {
            get;
            set;
        }
        public string MondayClose
        {
            get;
            set;
        }
        public string TuesdayOpen
        {
            get;
            set;
        }
        public string TuesdayClose
        {
            get;
            set;
        }
        public string WednesdayOpen
        {
            get;
            set;
        }
        public string WednesdayClose
        {
            get;
            set;
        }
        public string ThursdayOpen
        {
            get;
            set;
        }
        public string ThursdayClose
        {
            get;
            set;
        }
        public string FridayOpen
        {
            get;
            set;
        }
        public string FridayClose
        {
            get;
            set;
        }
        public string SaturdayOpen
        {
            get;
            set;
        }
        public string SaturdayClose
        {
            get;
            set;
        }
        public string SundayOpen
        {
            get;
            set;
        }
        public string SundayClose
        {
            get;
            set;
        }

        public static BranchOpeningHoursModel ConvertFrom(BranchOpeningHoursView value)
        {
            return new BranchOpeningHoursModel
            {
                BranchNo = value.BranchNo,
                BranchName = value.BranchName,
                MondayOpen = value.MondayOpen.HasValue ? value.MondayOpen.Value.ToString("hh':'mm") : (string)null,
                MondayClose = value.MondayClose.HasValue ? value.MondayClose.Value.ToString("hh':'mm") : (string)null,
                TuesdayOpen = value.TuesdayOpen.HasValue ? value.TuesdayOpen.Value.ToString("hh':'mm") : (string)null,
                TuesdayClose = value.TuesdayClose.HasValue ? value.TuesdayClose.Value.ToString("hh':'mm") : (string)null,
                WednesdayOpen = value.WednesdayOpen.HasValue ? value.WednesdayOpen.Value.ToString("hh':'mm") : (string)null,
                WednesdayClose = value.WednesdayClose.HasValue ? value.WednesdayClose.Value.ToString("hh':'mm") : (string)null,
                ThursdayOpen = value.ThursdayOpen.HasValue ? value.ThursdayOpen.Value.ToString("hh':'mm") : (string)null,
                ThursdayClose = value.ThursdayClose.HasValue ? value.ThursdayClose.Value.ToString("hh':'mm") : (string)null,
                FridayOpen = value.FridayOpen.HasValue ? value.FridayOpen.Value.ToString("hh':'mm") : (string)null,
                FridayClose = value.FridayClose.HasValue ? value.FridayClose.Value.ToString("hh':'mm") : (string)null,
                SaturdayOpen = value.SaturdayOpen.HasValue ? value.SaturdayOpen.Value.ToString("hh':'mm") : (string)null,
                SaturdayClose = value.SaturdayClose.HasValue ? value.SaturdayClose.Value.ToString("hh':'mm") : (string)null,
                SundayOpen = value.SundayOpen.HasValue ? value.SundayOpen.Value.ToString("hh':'mm") : (string)null,
                SundayClose = value.SundayClose.HasValue ? value.SundayClose.Value.ToString("hh':'mm") : (string)null
            };
        }

        public static BranchOpeningHours ConvertTo(BranchOpeningHoursModel value)
        {
            return new BranchOpeningHours
            {
                BranchNumber = value.BranchNo,
                MondayOpen = string.IsNullOrEmpty(value.MondayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.MondayOpen)),
                MondayClose = string.IsNullOrEmpty(value.MondayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.MondayClose)),
                TuesdayOpen = string.IsNullOrEmpty(value.TuesdayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.TuesdayOpen)),
                TuesdayClose = string.IsNullOrEmpty(value.TuesdayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.TuesdayClose)),
                WednesdayOpen = string.IsNullOrEmpty(value.WednesdayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.WednesdayOpen)),
                WednesdayClose = string.IsNullOrEmpty(value.WednesdayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.WednesdayClose)),
                ThursdayOpen = string.IsNullOrEmpty(value.ThursdayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.ThursdayOpen)),
                ThursdayClose = string.IsNullOrEmpty(value.ThursdayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.ThursdayClose)),
                FridayOpen = string.IsNullOrEmpty(value.FridayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.FridayOpen)),
                FridayClose = string.IsNullOrEmpty(value.FridayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.FridayClose)),
                SaturdayOpen = string.IsNullOrEmpty(value.SaturdayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.SaturdayOpen)),
                SaturdayClose = string.IsNullOrEmpty(value.SaturdayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.SaturdayClose)),
                SundayOpen = string.IsNullOrEmpty(value.SundayOpen) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.SundayOpen)),
                SundayClose = string.IsNullOrEmpty(value.SundayClose) ? new Nullable<TimeSpan>() : new Nullable<TimeSpan>(TimeSpan.Parse(value.SundayClose))
            };
        }

        internal static object AuditChanges(BranchOpeningHoursModel[] oldDataList, BranchOpeningHoursModel[] newDataList)
        {
            oldDataList = oldDataList.OrderBy(p => p.BranchNo).ToArray();
            newDataList = newDataList.OrderBy(p => p.BranchNo).ToArray();
            var result = new List<StoreTimeBranchAudit>();

            for (var i = 0; i < newDataList.Length; i++)
            {
                var oldData = oldDataList[i];
                var newData = newDataList[i];
                var changes = new List<StoreTimeAudit>();

                if (oldData.MondayOpen != newData.MondayOpen)
                {
                    changes.Add(new StoreTimeAudit("Monday opening", oldData.MondayOpen, newData.MondayOpen));
                }

                if (oldData.MondayClose != newData.MondayClose)
                {
                    changes.Add(new StoreTimeAudit("Monday closing", oldData.MondayClose, newData.MondayClose));
                }

                if (oldData.TuesdayOpen != newData.TuesdayOpen)
                {
                    changes.Add(new StoreTimeAudit("Tuesday opening", oldData.TuesdayOpen, newData.TuesdayOpen));
                }

                if (oldData.TuesdayClose != newData.TuesdayClose)
                {
                    changes.Add(new StoreTimeAudit("Tuesday closing", oldData.TuesdayClose, newData.TuesdayClose));
                }

                if (oldData.WednesdayOpen != newData.WednesdayOpen)
                {
                    changes.Add(new StoreTimeAudit("Wednesday opening", oldData.WednesdayOpen, newData.WednesdayOpen));
                }

                if (oldData.WednesdayClose != newData.WednesdayClose)
                {
                    changes.Add(new StoreTimeAudit("Wednesday closing", oldData.WednesdayClose, newData.WednesdayClose));
                }

                if (oldData.ThursdayOpen != newData.ThursdayOpen)
                {
                    changes.Add(new StoreTimeAudit("Thursday opening", oldData.ThursdayOpen, newData.ThursdayOpen));
                }

                if (oldData.ThursdayClose != newData.ThursdayClose)
                {
                    changes.Add(new StoreTimeAudit("Thursday closing", oldData.ThursdayClose, newData.ThursdayClose));
                }

                if (oldData.FridayOpen != newData.FridayOpen)
                {
                    changes.Add(new StoreTimeAudit("Friday opening", oldData.FridayOpen, newData.FridayOpen));
                }

                if (oldData.FridayClose != newData.FridayClose)
                {
                    changes.Add(new StoreTimeAudit("Friday closing", oldData.FridayClose, newData.FridayClose));
                }

                if (oldData.SaturdayOpen != newData.SaturdayOpen)
                {
                    changes.Add(new StoreTimeAudit("Saturday opening", oldData.SaturdayOpen, newData.SaturdayOpen));
                }

                if (oldData.SaturdayClose != newData.SaturdayClose)
                {
                    changes.Add(new StoreTimeAudit("Saturday closing", oldData.SaturdayClose, newData.SaturdayClose));
                }

                if (oldData.SundayOpen != newData.SundayOpen)
                {
                    changes.Add(new StoreTimeAudit("Sunday opening", oldData.SundayOpen, newData.SundayOpen));
                }

                if (oldData.SundayClose != newData.SundayClose)
                {
                    changes.Add(new StoreTimeAudit("Sunday closing", oldData.SundayClose, newData.SundayClose));
                }

                if (changes.Count > 0)
                { 
                    result.Add(new StoreTimeBranchAudit { Branch = oldData.BranchNo, Changes = changes });
                }
            }
            return result;
        }

        public class StoreTimeBranchAudit
        {
            public short Branch { get; set; }
            public List<StoreTimeAudit> Changes { get; set; }
        }

        public class StoreTimeAudit
        {
            public StoreTimeAudit(string day, string from, string to)
            {
                this.Day = day;
                this.From = from;
                this.To = to;
            }

            public string Day { get; set; }
            public string From { get; set; }
            public string To { get; set; }
        }
    }
}