using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using Blue.Cosacs.Credit;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Credit.Repositories;
using Blue.Events;
using FileHelpers;
using Blue.Cosacs.Web.Areas.Credit.Models;
using System.Data.SqlClient;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Credit.Controllers
{
    public class StoreCardImportController : Controller
   {
        private readonly ActiveStoreCardsRepository activeStoreCardsRepository;
        protected readonly IEventStore Audit;

        public StoreCardImportController(IEventStore audit)
        {
            this.Audit = audit;
            this.activeStoreCardsRepository = new ActiveStoreCardsRepository();
        }

        [Permission(CreditPermissionEnum.StoreCardImportExport)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public FileResult Export()
        {
            var fileHeader = "Card Number, Name On Card, Available Spend, Account Number";

            var dataToExport = new List<ActiveStoreCardsResult>();

            dataToExport = activeStoreCardsRepository.getActiveStoreCards();

            var file = fileHeader + "\r\n" + BaseImportFile<ActiveStoreCardsResult>.WriteToString(dataToExport);

            var fileName = string.Format("ActiveStoreCards {0}.csv", DateTime.Now.ToString());

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        [HttpGet]
        public ActionResult Import()
        {
            return View();
        }

        [HttpPost]
        public ViewResult Import(HttpPostedFileBase fileUpload)
        {
            var errorMessage = new ImportResult();
            object messageLog = string.Empty;

            if (fileUpload != null && fileUpload.ContentLength > 0)
            {
                var fileName = Path.GetFileName(fileUpload.FileName);
                var importErrors = new List<ErrorInfo>();
                string fileString = null;

                using (var reader = new StreamReader(fileUpload.InputStream))
                {
                    fileString = reader.ReadToEnd();
                }

                var results = BaseImportFile<ImportStoreCardTransactions>.ImportStringAndCheckForErros(fileString, out importErrors);

                if (importErrors != null)
                {
                    errorMessage.Succeed = false;
                    errorMessage.Errors = (from ie in importErrors
                                           select ie.LineNumber.ToString() + " - " + ie.RecordString.ToString())
                                          .ToList();

                    messageLog = fileName + " - failed to upload";
                }
                else
                {
                    using (var scope = Context.Write())
                    {
                        try
                        {
                            scope.Context.StoreCardImport.AddRange(from r in results
                                                                   select new StoreCardImport
                                                                {
                                                                    CardNumber = r.CardNumber,
                                                                    ImportDate = r.ExportDate,
                                                                    TransactionDate = r.TransactionDate,
                                                                    Amount = r.TransactionAmount
                                                                });
                            scope.Context.SaveChanges();

                            var x = new ThirdPartyStoreCardImport();
                            x.ExecuteNonQuery();

                            scope.Complete();
                            
                            errorMessage.Succeed = true;
                            messageLog = fileName + " - file uploaded successfully";
                        }
                        catch (Exception ex)
                        {
                            var current = ex;
                            var str = new StringBuilder();

                            errorMessage.Succeed = false;
                            errorMessage.Errors.Add("This file contains incorrect records");

                            while (current != null)
                            {
                                str.AppendLine(current.Message);
                                current = current.InnerException;
                            }

                            messageLog = str.ToString();
                        }
                    }
                }
            }
            else
            {
                errorMessage.Succeed = false;
                errorMessage.Errors.Add("No file Selected!");
                messageLog = "No file Selected!";
            }

            Audit.LogAsync(new { ErrorMessage = messageLog }, Blue.Cosacs.Credit.CreditEventType.StoreCardImport, Blue.Cosacs.Credit.CreditEventCategory.Credit);

            return View("Index", errorMessage);
        }
    }
}
