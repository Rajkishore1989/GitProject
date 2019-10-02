using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Service;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class ServiceClaimsController : Controller
    {
        private readonly IClock clock;

        public ServiceClaimsController(IClock clock)
        {
            this.clock = clock;
        }

        [HttpGet]
        [Permission(ReportPermissionEnum.ServiceClaims)]
        [LongRunningQueries]
        public JsonResult GetServiceClaims(string dateLoggedFrom, string dateLoggedTo, string dateResolvedFrom, string dateResolvedTo,
                                                            string supplier, string primaryCharge, string department,
                                                            bool includeTechnicianReport, bool supplierCharged, bool fywCharged, bool ewCharged,
                                                            short pageNumber = 1, short pageSize = 250)
        {
            var values = Search(dateLoggedFrom, dateLoggedTo, dateResolvedFrom, dateResolvedTo,
                supplier, primaryCharge, department,
                includeTechnicianReport, supplierCharged, fywCharged, ewCharged, pageNumber, pageSize);
            return Json(new
            {
                Result = "ok",
                TotalRows =  values.Any() ? values.First().TotalRows : 0,
                data = values
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(ReportPermissionEnum.ServiceClaims)]
        public FileResult Export(string dateLoggedFrom, string dateLoggedTo, string dateResolvedFrom, string dateResolvedTo,
                                                            string supplier, string primaryCharge, string department,
                                                            bool includeTechnicianReport, bool supplierCharged, bool fywCharged, bool ewCharged)
        {
            const string fileHeader = "Country Code,Service Request Id,Supplier Name,Product Category,Primary Charge,Date Logged,Date Resolved,Date Delivered,Date Account Opened,FYW Description,FYW Contract Number,EW Description,EW Contract Number,Model Number,Serial Number,Replacement Issued,Technician Report,Comments,Customer Name,Account Number,Resolution,Original Product Cost Price,Parts Cost,Product Code,Product Description,Part Number,Part Description,Part Quantity,Part Unit Price,Part Cost,Supplier Parts Charge,FYW Parts Charge,EW Parts Charge,Supplier Labour Charge,FYW Labour Charge,EW Labour Charge,Supplier Additional Charge,FYW Additional Charge,EW Additional Charge,Food Loss Value,Total Charge,Previous Repairs Within 90 Days";

            var file = fileHeader + "\n" + BaseImportFile<ServiceClaimsResult>.WriteToString(Search(dateLoggedFrom, dateLoggedTo, dateResolvedFrom, dateResolvedTo,
                                                            supplier, primaryCharge, department,
                                                            includeTechnicianReport, supplierCharged, fywCharged, ewCharged, 1, short.MaxValue));

            //Henrry Note: I know the file name is not correct but I need to hurry up this...2 days to make 2 reports
            //             details like file name will be deal later
            var fileName = new StringBuilder();
            
            fileName.AppendFormat("{0}-ServiceClaims", this.clock.Now.ToString("yyyyMMdd"));
            fileName.AppendFormat("_dateLoggedFrom-{0}", dateLoggedFrom);
            fileName.AppendFormat("_dateLoggedTo-{0}", dateLoggedTo);
            fileName.AppendFormat("_dateResolvedFrom-{0}", dateResolvedFrom);
            fileName.AppendFormat("_dateResolvedTo-{0}", dateResolvedTo);

            

            if(!String.IsNullOrEmpty(supplier))
                fileName.AppendFormat("_supplier-{0}", supplier);
            if (!String.IsNullOrEmpty(primaryCharge))
                fileName.AppendFormat("_primaryCharge-{0}", primaryCharge);
            if (!String.IsNullOrEmpty(department))
                fileName.AppendFormat("_department-{0}", department);
            if (includeTechnicianReport)
                fileName.AppendFormat("_includeTechnicianReport-{0}", includeTechnicianReport);
            if (supplierCharged)
                fileName.AppendFormat("_supplierCharged-{0}", supplierCharged);
            if (fywCharged)
                fileName.AppendFormat("_fywCharged-{0}", fywCharged);
            if (ewCharged)
                fileName.AppendFormat("_ewCharged-{0}", ewCharged);

            ///////

            fileName.Append(".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
        }

        private List<ServiceClaimsResult> Search(string dateLoggedFrom, string dateLoggedTo, string dateResolvedFrom, string dateResolvedTo,
                                                            string supplier, string primaryCharge, string department,
                                                            bool includeTechnicianReport, bool supplierCharged, bool fywCharged, bool ewCharged,
                                                            short pageNumber, short pageSize)
        {
            var query = new ReportSqlService();

            return query.GetServiceClaims(dateLoggedFrom, dateLoggedTo, dateResolvedFrom, dateResolvedTo,
                                                            supplier, primaryCharge, department,
                                                            includeTechnicianReport, supplierCharged, fywCharged, ewCharged, pageNumber, pageSize).ToList();
        }

    
    }
}
