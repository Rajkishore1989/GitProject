using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Cosacs.Report.Service;
using Blue.Cosacs.Web.Common;
using System.Text;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class ServiceMonthlyClaimsController : Controller
    {
        private const string FileHeader = "Supplier,CurrentMonth,YearToDate";
        //
        // GET: /Report/ServiceMonthlyClaims/
        [Permission(Cosacs.Report.ReportPermissionEnum.ServiceMonthlyClaims)]
        public ActionResult Index()
        {
            return View();
        }

         [HttpGet]
         public JsonResult Filter(string finYear, string month, string supplier)
         {
             dynamic valid = this.ValidateSearch(finYear, month, supplier);

             if (!valid.IsOk)
             {
                 return Json(new
                 {
                     Result = valid.Result,
                     Message = valid.Message
                 }, JsonRequestBehavior.AllowGet);
             }

             return Json(new
             {
                 Result = "ok",
                 data = Search(finYear, month, supplier)
             }, JsonRequestBehavior.AllowGet);
         }

         [HttpGet]
         public ActionResult Export(string finYear, string month, string supplier)
         {
             dynamic valid = this.ValidateSearch(finYear, month, supplier);

             if (!valid.IsOk)
             {
                 return Json(new
                 {
                     Result = valid.Result,
                     Message = valid.Message
                 }, JsonRequestBehavior.AllowGet);
             }

             var file = FileHeader + "\n" + BaseImportFile<ClaimsSupplierResult>.WriteToString(Search(finYear, month, supplier));

             var fileName = new StringBuilder();

             fileName.AppendFormat("{0}_MonthlyClaimsSummaryBySupplier_year-{1}_month{2}_supplier-{3}.csv",
                 DateTime.Now.ToString("yyyymmdd"), finYear, month, supplier);

             return File(System.Text.Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
         }

         private List<ClaimsSupplierResult> Search(string finYear, string month, string supplier)
        {
            var query = new ReportSqlService();

            return query.GetMonthlyClaimsSummaryBySupplier(finYear, month, supplier).ToList();
        }

        private ExpandoObject ValidateSearch(string finYear, string month, string supplier)
        {
            dynamic returnValue = new ExpandoObject();

            returnValue.Result = "ok";
            returnValue.IsOk = true;

            if (string.IsNullOrEmpty(finYear))
            {
                returnValue.Result = "error";
                returnValue.Message = "Invalid financial year";
                returnValue.IsOk = false;
            }

            if (string.IsNullOrEmpty(month))
            {
                returnValue.Result = "error";
                returnValue.Message = "Invalid month";
                returnValue.IsOk = false;
            }

            if (!string.IsNullOrEmpty(supplier)) return returnValue;

            returnValue.Result = "error";
            returnValue.Message = "Invalid supplier";
            returnValue.IsOk = false;


            return returnValue;
        }
    }
}
