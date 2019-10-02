using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Blue.Cosacs.Service;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Cosacs.Service.Solr;
using Blue.Cosacs.Web.Areas.Service.Models;
using Blue.Cosacs.Web.Areas.Stock.Controllers;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Web.Helpers;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using Blue.Service;
using MerchandisingRef = Blue.Cosacs.Merchandising;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class RequestsController : Controller
    {
        public RequestsController(IClock clock, RequestRepository repository, Settings settings, IEventStore audit,
            CatalogueController catalogueController, ChargesRepository chargesRepository, PartsRepository partsRepository,
            MerchandisingRef.Settings merchandisingSettings, MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo)
        {
            this.clock = clock;
            this.repository = repository;
            this.merchandisingSettings = merchandisingSettings;
            this.settings = settings;
            this.audit = audit;
            this.catalogueController = catalogueController;
            this.chargesRepository = chargesRepository;
            this.partsRepository = partsRepository;
            this.merchandisingTaxRepo = merchandisingTaxRepo;
        }

        private readonly IClock clock;
        private readonly RequestRepository repository;
        private readonly MerchandisingRef.Settings merchandisingSettings;
        private readonly Settings settings;
        private readonly IEventStore audit;
        private readonly CatalogueController catalogueController;
        private readonly ChargesRepository chargesRepository;
        private readonly PartsRepository partsRepository;
        private readonly MerchandisingRef.Repositories.TaxRepository merchandisingTaxRepo;
        private const string CustomQueryRepairOverdue = "RepairOverdue";

        [HttpGet]
        [Public]
        public JsonResult CustomersWithOpenSr(DateTime sinceWhen)
        {
            using (var scope = Context.Read())
            {
                var initDate = sinceWhen.Date;

                var result = (from r in scope.Context.Request
                              join rc in scope.Context.RequestContact on r.Id equals rc.RequestId
                              where (r.Type == "SI" || r.Type == "II") && (r.State != "Closed" && r.State != "Resolved") && r.CreatedOn <= initDate
                              select new
                              {
                                  RequestId = r.Id,
                                  r.CustomerId,
                                  r.State,
                                  r.Item,
                                  r.Branch,
                                  r.CustomerFirstName,
                                  r.CustomerLastName,
                                  rc.Type,
                                  rc.Value,
                                  r.CreatedOn
                              })
                                .GroupBy(p => new { p.RequestId, p.CustomerId, p.State, p.Item, p.Branch, p.CustomerFirstName, p.CustomerLastName, p.CreatedOn })
                                .Select(p => new
                                {
                                    p.Key.RequestId,
                                    p.Key.CustomerId,
                                    p.Key.State,
                                    p.Key.Item,
                                    p.Key.Branch,
                                    p.Key.CustomerFirstName,
                                    p.Key.CustomerLastName,
                                    Contact = p.Select(cont => new
                                    {
                                        cont.Type,
                                        cont.Value
                                    }),
                                    p.Key.CreatedOn
                                })
                                .ToList();

                return new LargeJsonResult
                {
                    Data = result,
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
            }
        }

        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JsonResult InternalSearch(CustomerSearch CustomerSearch)
        {
            var searchResults = new CosacsRepository(clock).Search(CustomerSearch.Type, CustomerSearch.Value, CustomerSearch.Branch,
                CustomerSearch.srType, true);

            return Json(searchResults, JsonRequestBehavior.AllowGet);
        }
        // CR2018-008 by tosif ali 17/10/2018*@
        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JsonResult ExternalSearch(CustomerSearch CustomerSearch)
        {
            var searchResults = new CosacsRepository(clock).ExternalSearch(CustomerSearch.Type, CustomerSearch.Value, CustomerSearch.Branch,
                CustomerSearch.srType, true);

            return Json(searchResults, JsonRequestBehavior.AllowGet);
        }
        // End hear

        //Search
        [Permission(ServicePermissionEnum.SearchServiceRequests)]
        public ActionResult Index(string q = "")
        {
            ViewBag.title = "Search Service Requests";
            ViewBag.buttons = (new
            {
                SummaryPrint = new
                {
                    enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrSummaryPrint),
                    label = "Summary Print"
                },
                BatchPrint = new
                {
                    enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrBatchPrint),
                    label = "Batch Print"
                },
                Export = new
                {
                    enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrExport),
                    label = "Export"
                }
            }).ToJson();
            return View("Search", model: SearchSolr(q));
        }

        [HttpGet]
        [Permission(ServicePermissionEnum.SearchServiceRequests)]
        public void SearchInstant(string q, int start = 0, int rows = 25)
        {
            var result = SearchSolr(q, start, rows);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "serviceRequest")
        {
            var solr = new Blue.Solr.Query();
            var request = solr.GetSearchRequest(q);

            FixToDate(request, "CreatedOn");
            FixToDate(request, "LastUpdatedOn");

            SetParametersForCustomQuery(request);

            return solr
                .SelectJsonWithJsonQuery(
                    request,
                    "Type:" + type,
                    facetFields: new[] { "HomeBranchName", "ServiceStatus", "SRType", "TechName", "FaultTags", "Printed", "RepairLimitWarning" },
                    showEmpty: false,
                    start: start,
                    rows: rows);
        }

        private void FixToDate(Solr.Request request, string filterName)
        {
            if (request.DateFields.Count <= 0 || !request.DateFields.ContainsKey(filterName) ||
                request.DateFields[filterName] == null) return;

            var date = request.DateFields[filterName].Values[1];
            DateTime temp;

            if (DateTime.TryParse(date.ToString(), out temp))
            {
                request.DateFields[filterName].Values[1] = temp.AddDays(1);
            }
        }

        private void SetParametersForCustomQuery(Solr.Request request)
        {
            if (request.CustomQueries == null)
            {
                return;
            }

            if (request.CustomQueries.Contains(CustomQueryRepairOverdue))
            {
                if (request.DateFields == null)
                {
                    request.DateFields = new Dictionary<string, Solr.Request.Filter>();
                }

                request.DateFields.Add("TechAllocated", new Solr.Request.Filter { Values = new ArrayList(new string[] { "*", "NOW-1DAY" }) });
                request.DateFields.Add("ResolutionDate", new Solr.Request.Filter { Values = new ArrayList(new string[] { "*", "0001-01-01T00:00:00Z" }) });

                request.FacetFields.Add("ServiceStatus", new Solr.Request.Filter { Values = new ArrayList(new string[] { "Closed" }), Negate = true });
            }
        }

        [LongRunningQueries]
        [Permission(Blue.Cosacs.Warehouse.Common.WarehousePermissionEnum.Reindex)]
        public JsonResult ForceIndex()
        {
            audit.LogAsync(new { }, EventType.ServiceIndex, EventCategory.Index);
            return Json(SolrIndex.IndexRequest(), JsonRequestBehavior.AllowGet);
        }

        //View Request
        [Permission(ServicePermissionEnum.CreateServiceRequest)]
        public ActionResult New()
        {
            ViewBag.DefaultStockLocation = settings.DefaultStockLocationBranch;
            ViewBag.Title = "New Service Request";
            ViewBag.TitleShow = false;
            return View("Detail");
        }

        [HttpPost]
        [Permission(ServicePermissionEnum.SaveServiceRequests)]
        public JsonResult Create(RequestItem request)
        {
            // We don't want to try and update the request history since it is just a view
            request.History = null;
            ModelState.Clear();

            if (!TryValidateModel(request))
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return Json(ModelState.ErrorsToArray());
            }
            else
            {
                var lastUpdated = LastUpdated();
                var isNew = false;
                if (request.Id == 0)
                {
                    request.Id = HiLo.Cache("Service.Request").NextId();
                    isNew = true;
                }
                return Json(new { Id = request.Id, techError = repository.Save(request, lastUpdated, audit, isNew), lastUpdated = lastUpdated });
            }
        }

        [HttpPut]
        [Permission(ServicePermissionEnum.SaveServiceRequests)]
        public JsonResult SaveComment(int serviceRequest, string comment)
        {
            repository.SaveComment(serviceRequest, comment, this.GetUser().FullName);
            return Json(new { lastUpdated = LastUpdated() }, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public ActionResult Get(int id)
        {
            ViewBag.DefaultStockLocation = settings.DefaultStockLocationBranch;
            ViewBag.Title = "Service Request " + id;
            ViewBag.TitleShow = false;
            return View("Detail");
        }

        [HttpGet]
        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JSendResult GetCustomerDetails(int id)
        {
            var request = repository.Get(id);
            if (request == null)
            {
                return new JSendResult(JSendStatus.BadRequest, "There is no request with the specified id");
            }

            return new JSendResult(
                JSendStatus.Success,
                new
                {
                    CustomerId = request.CustomerId,
                    Title = request.CustomerTitle,
                    FirstName = request.CustomerFirstName,
                    LastName = request.CustomerLastName,
                    AddressLine1 = request.CustomerAddressLine1,
                    AddressLine2 = request.CustomerAddressLine2,
                    TownCity = request.CustomerAddressLine3,
                    PostCode = request.CustomerPostcode,
                    Notes = request.CustomerNotes,
                    Contacts = request.Contacts
                });
        }

        [HttpGet]
        [Permission(ServicePermissionEnum.ViewServiceRequest)]
        public JsonResult GetRequest(int id)
        {
            var scr = new SupplierCostsRepository(clock);

            var request = repository.Get(id);
            if (request == null)
            {
                throw new System.Web.HttpException(404, "There is no request with the specified id");
            }

            var costs = scr.GetSupplierCostsWithExchangeRate(request.ResolutionSupplierToCharge, request.ResolutionCategory);

            PopulateLevelDataForExistingRequests(request);

            var chargesQuery = new CostMatrixQuery
            {
                ProductLevel_1 = request.ProductLevel_1,
                ProductLevel_2 = request.ProductLevel_2.HasValue ? request.ProductLevel_2.Value.ToString() : string.Empty,
                ProductLevel_3 = request.ProductLevel_3,
                ItemNumber = request.ItemNumber,
                Manufacturer = request.Manufacturer,
                RepairType = request.RepairType
            };
            var labourCharges = chargesRepository.GetCharges(chargesQuery);
            var partsCharges = partsRepository.GetCharges(chargesQuery);
            var branchNo = this.GetUser().Branch;
            var branchDetails = repository.GetBranchDetails(branchNo);

            var TaxRate = GetCountryTaxRate();
            var TaxType = merchandisingSettings.TaxInclusive ? "I" : "E";

            var result = new
            {
                RequestItem = request,
                MasterData = new
                {
                    ServiceResolutions = GetResolutions(),
                    User = new CurrentUser()
                        {
                            UserName = this.GetUser().FullName,
                            Branch = this.GetUser().Branch,
                            UserId = this.GetUser().Id,
                            Country = new CosacsRepository(clock).GetCountryCode(),
                            Permissions = this.GetUser().PermissionIds.Where(p => p >= 1600 && p < 1700), // Service Permissions Only.
                            /*this should be changed this WILL bite us back */
                            /*we should look for permissions that are within */
                            /*the ServicePermissionEnum enum */
                        },
                    Settings = new
                    {
                        settings.ServiceFaultTag,
                        TaxRate,
                        TaxType,
                        BerThreshold = settings.ServiceBER,
                        BerMarkup = settings.ServiceBERMarkup,
                        BerReplacement = settings.ServiceReplacement,
                        settings.PreviousRepairCostPercentage,
                        InstallationFurnitureAccount = settings.InstallFurniture,
                        InstallationElectricalAccount = settings.InstallElectrical,
                    },
                    SupplierCostMatrix = costs != null ? costs.costs : null,
                    LabourCostMatrix = labourCharges,
                    PartsCostMatrix = partsCharges,
                    ResolutionCategories = scr.GetProducts(request.ResolutionSupplierToCharge),
                    TaxNo = branchDetails.TaxNumber.Replace("VAT REGISTRATION NO: ", ""),
                    UserUranchName = branchNo + " " + branchDetails.BranchName,
                    BranchAddress1 = branchDetails.BranchAddress1,
                    BranchAddress2 = branchDetails.BranchAddress2,
                    BranchAddress3 = branchDetails.BranchAddress3
                }
            };

            //if (result.RequestItem !=null)
            //{
            //    result.RequestItem.ReplacementIssued = result.RequestItem.ReplacementIssued == true ||
            //        (result.RequestItem.Resolution == "Beyond Economic Repair" && result.MasterData.Settings.BerReplacement); 
            //}

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        private void PopulateLevelDataForExistingRequests(RequestItem request)
        {
            if (request.ProductLevel_1 == null || request.ProductLevel_2 == null || request.ProductLevel_3 == null)
            {
                var itemId = 0;
                if (!int.TryParse(request.ItemId, out itemId))
                {
                    return;
                }

                var merchandisingRepo = new Blue.Cosacs.Stock.Repositories.ProductRepository();
                var productInfo = merchandisingRepo.GetProductRelationsByItemNumber(request.ItemNumber);

                if (productInfo != null)
                {
                    request.ProductLevel_1 = productInfo.Department;
                    request.ProductLevel_2 = productInfo.Category;
                    request.ProductLevel_3 = productInfo.Class;
                }
            }
        }

        private LastUpdated LastUpdated()
        {
            return new LastUpdated()
            {
                LastUpdatedOn = clock.Now,
                LastUpdatedUser = this.GetUser().Id,
                LastUpdatedUserName = this.GetUser().FullName
            };
        }

        [Permission(ServicePermissionEnum.EnableFoodLoss)]
        public ActionResult PrintFoodLoss(int id)
        {
            audit.LogAsync(new { RequestId = id }, EventType.PrintFoodLoss, EventCategory.Service);
            return View("Printing/FoodLossReport", repository.GetFoodLoss(id));
        }

        [Permission(ServicePermissionEnum.PrintServiceRequest)]
        public ActionResult Print(int id)
        {
            repository.UpdatePrinted(new[] { id });
            ViewBag.WarrantyAvail = settings.ShowWarrantyAvailOnStatement;
            audit.LogAsync(new { RequestId = id }, EventType.PrintServiceRequest, EventCategory.Service);
            return View("Printing/Request", new[] { repository.Get(id) });
        }


        [Permission(ServicePermissionEnum.SrBatchPrint)]
        public ViewResult BatchPrintGetData(string ids)
        {
            audit.LogAsync(new { RequestIds = ids }, EventType.RequestBatchPrint, EventCategory.Service);
            ViewBag.WarrantyAvail = settings.ShowWarrantyAvailOnStatement;
            return View("Printing/Request", repository.BatchPrint(ids.Split(',').Select(s => Convert.ToInt32(s))));
        }


        [Permission(ServicePermissionEnum.SrSummaryPrint)]
        public ViewResult SummaryPrintCurrentUser(string query)
        {
            var solrQuery = new Blue.Solr.Query();
            var request = solrQuery.GetSearchRequest(query);
            var technician = new ArrayList();
            technician.Add(this.GetUser().FullName);
            request.FacetFields["TechName"] = new Solr.Request.Filter { Values = technician };

            var sw = new StringWriter();
            new Newtonsoft.Json.JsonSerializer { NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore }.Serialize(sw, request);
            return SummaryPrint(sw.ToString());
        }

        [Permission(ServicePermissionEnum.SrSummaryPrint)]
        public ViewResult SummaryPrint(string query)
        {
            var requestIds = GetRequestIdsForSearchParameters(query);
            ViewBag.User = this.GetUser().FullName;
            ViewBag.DatePrinted = clock.UtcNow;
            audit.LogAsync(new { RequestIds = string.Join(",", requestIds) }, EventType.SummaryPrint, EventCategory.Service);
            return View("Printing/SummaryPrint", repository.SummaryPrint(requestIds));
        }

        [Permission(ServicePermissionEnum.SrExport)]
        public FileResult ExportCurrentUser(string query)
        {
            var solrQuery = new Blue.Solr.Query();
            var request = solrQuery.GetSearchRequest(query);
            var technician = new ArrayList();
            technician.Add(this.GetUser().FullName);
            request.FacetFields["TechName"] = new Solr.Request.Filter { Values = technician };

            var sw = new StringWriter();
            new Newtonsoft.Json.JsonSerializer { NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore }.Serialize(sw, request);
            return Export(sw.ToString());
        }

        [Permission(ServicePermissionEnum.SrExport)]
        public FileResult Export(string query)
        {
            var requestIds = GetRequestIdsForSearchParameters(query);
            var det = repository.SummaryPrint(requestIds);
            var fileName = string.Format("SummaryExport.csv");

            var file = "Service Request,Status,Date Logged,Days Outstanding,Date Changed,Customer Charge Account,Deposit Paid,Allow Charge Account Cancellation\n" +
                BaseImportFile<ExportSummaryPrintView>.WriteToString(det
                .Select(p => (ExportSummaryPrintView)p)
                .ToList());
            audit.LogAsync(new { RequestIds = string.Join(",", requestIds) }, EventType.SummaryPrint, EventCategory.Service);
            return File(System.Text.Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        [Permission(ServicePermissionEnum.SrExport)]
        public FileResult ExportOld(string ids)
        {
            var det = repository.SummaryPrint(ids.Split(',').Select(s => Convert.ToInt32(s)));
            var fileName = string.Format("SummaryExport.csv");

            var file = "Service Request,Status,Date Logged,Days Outstanding,Date Changed,Customer Charge Account,Deposit Paid,Allow Charge Account Cancellation\n" +
                BaseImportFile<ExportSummaryPrintView>.WriteToString(det
                .Select(p => (ExportSummaryPrintView)p)
                .ToList());
            audit.LogAsync(new { RequestIds = ids }, EventType.SummaryPrint, EventCategory.Service);
            return File(System.Text.Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        [HttpGet]
        [Permission(ServicePermissionEnum.SaveServiceRequests)]
        public JsonResult StockItem(string search, int branch, char type)
        {
            return Json(repository.StockSearch(search, branch, type), JsonRequestBehavior.AllowGet);
        }

        private IList<int> GetRequestIdsForSearchParameters(string query)
        {
            var ids = new List<int>();

            var solrDocs = GetDocumentsFromSolr(query);
            if (solrDocs == null)
                return ids;

            foreach (var item in solrDocs)
            {
                var docItem = item as Dictionary<string, object>;
                ids.Add((int)docItem["RequestId"]);
            }

            if (ids.Count > 1000)
                throw new Common.TooManyResultsException("Your filters returned more than 1000 Service Requests. Please update your filters to reduce this number to under a 1000.");

            return ids;
        }

        private IEnumerable GetDocumentsFromSolr(string query)
        {
            var solrResponse = new Blue.Solr.Query().SelectAllRows(query, "RequestId", "Type:serviceRequest");
            var jsObject = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(solrResponse);
            if (jsObject == null)
                return null;

            if (jsObject.ContainsKey("response"))
            {
                var response = (Dictionary<string, object>)jsObject["response"];
                if (response.ContainsKey("docs"))
                {
                    return response["docs"] as ArrayList;
                }
            }

            return null;
        }

        private IList<string> GetResolutions()
        {
            using (var scope = Context.Read())
            {
                return scope.Context.Resolution
                    .Select(p => p.Description)
                    .ToList();
            }
        }

        [HttpGet]
        public JsonResult GetChargeTo()
        {
            return Json(repository.GetChargeTo(), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult PrimaryGetChargeTo()
        {
            return Json(repository.PrimaryGetChargeTo(), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetBranchDetails(short branchNo)
        {
            return Json(repository.GetBranchDetails(branchNo), JsonRequestBehavior.AllowGet);
        }

        public JsonResult CheckForOpenServiceRequests(string acctno)
        {
            var openSRExists = repository.CheckForOpenServiceRequests(acctno);
            return Json(openSRExists, JsonRequestBehavior.AllowGet);
        }

        private decimal GetCountryTaxRate()
        {
            var currentTaxRateObj = merchandisingTaxRepo.GetCurrent();
            if (currentTaxRateObj != null)
            {
                return merchandisingTaxRepo.GetCurrent().Rate * 100;
            }
            return 0;
        }
    }
}
