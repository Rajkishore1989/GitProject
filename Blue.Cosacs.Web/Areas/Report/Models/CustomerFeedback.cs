using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Web.Common;

namespace Blue.Cosacs.Web.Areas.Report.Models
{
    public class CustomerFeedback
    {
        public List<TechnicianName> Technicians { get; set; }
        public List<BranchPickListProvider> Branches { get; set; }
        //public Dictionary<string, string> Departments { get; set; }
        public string Departments { get; set; }         // TO DO
    }
}
