using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Blue.Cosacs.Service;
using Blue.Cosacs.Service.Models;

namespace Blue.Cosacs.Web.Areas.Service.Models
{
    public class TechnicianPaymentsPrint
    {
        public List<ExportTechnicianPayment> Payments
        {
            get;
            set;
        }

        public TechnicianPaymentPrint SearchCriteria
        {
            get;
            set;
        }
    }
}