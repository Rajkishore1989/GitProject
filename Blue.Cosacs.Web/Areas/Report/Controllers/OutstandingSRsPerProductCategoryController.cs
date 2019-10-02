using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Blue.Cosacs.Report.Service;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class OutstandingSRsPerProductCategoryController : Controller
    {
        //
        // GET: /Report/OutstandingSRsPerProductCategory/

        [Permission(Cosacs.Report.ReportPermissionEnum.OutstandingSRsProdCat)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public JsonResult Filter(OutstandingSRsPerProductCategoryFilter searchFilter)
        {
            dynamic valid = ValidateSearch(searchFilter);

            if (!valid.IsOk)
            {
                return Json(new
                {
                    valid.Result,
                    valid.Message
                }, JsonRequestBehavior.AllowGet);
            }

            return Json(new
            {
                Result = "ok",
                data = Search(searchFilter)
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public ActionResult Export(OutstandingSRsPerProductCategoryFilter searchFilter)
        {
            dynamic valid = ValidateSearch(searchFilter);

            if (!valid.IsOk)
            {
                return Json(new
                {
                    valid.Result,
                    valid.Message
                }, JsonRequestBehavior.AllowGet);
            }

            var headerLbl = searchFilter.Status == "Allocated" ? "Allocated" : "Outstanding";
            var fileHeader = string.Format("Product Category, Days {0} 0-3, Days {0} 4-7, Days Days {0} 8-14, Days {0} 15+", headerLbl);

            var file = fileHeader + "\n" + BaseImportFile<OutstandingSRsPerProductCategoryResult>.WriteToString(Search(searchFilter));

            var fileName = new StringBuilder();

            
            fileName.AppendFormat("{0}_OutstandingSRsPerProductCategory_from-{1}_to-{2}_status-{3}",
                FormatNullableDate(searchFilter.CurrentDate), FormatNullableDate(searchFilter.DateFrom),
                FormatNullableDate(searchFilter.DateTo), searchFilter.Status);

            if (!string.IsNullOrEmpty(searchFilter.Supplier))
            {
                fileName.AppendFormat("_supplier-{0}", searchFilter.Supplier);
            }

            if (searchFilter.Technician.HasValue)
            {
                fileName.AppendFormat("_technician-{0}", searchFilter.Technician.Value);
            }

            if (!string.IsNullOrEmpty(searchFilter.WarrantyType))
            {
                fileName.AppendFormat("_warrantyType-{0}", searchFilter.WarrantyType);
            }

            fileName.Append(".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
        }

        private string FormatNullableDate(DateTime? d)
        {
            if (d.HasValue)
                return d.Value.ToString("yyyyMMdd");
            else
                return DateTime.MinValue.ToString("yyyyMMdd");
        }


        #region Private Methods

        private List<OutstandingSRsPerProductCategoryResult> Search(OutstandingSRsPerProductCategoryFilter searchFilter)
        {
            var query = new ReportSqlService();

            return query.GetOutstandingSRsPerProductCategory(searchFilter).ToList();
        }

        private ExpandoObject ValidateSearch(OutstandingSRsPerProductCategoryFilter searchFilter)
        {
            dynamic returnValue = new ExpandoObject();

            returnValue.Result = "ok";
            returnValue.IsOk = true;

            if (searchFilter.Validate()) return returnValue;

            returnValue.Result = "error";
            returnValue.Message = "Search filter not valid, the parameters Date Logged From/To and Status can't be null.";
            returnValue.IsOk = false;

            return returnValue;
        }

        #endregion

    }
}
