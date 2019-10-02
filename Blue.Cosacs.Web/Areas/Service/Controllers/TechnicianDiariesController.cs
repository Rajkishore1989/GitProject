using Blue.Admin;
using Blue.Admin.Repositories;
using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Cosacs.Web.Areas.Service.Models;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using Blue.Service;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Domain = Blue.Cosacs.Service;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class TechnicianDiariesController : Controller
    {
        public TechnicianDiariesController(IClock clock, IEventStore audit, Blue.Cosacs.Service.Settings settings, TechnicianRepository techRepository)
        {
            this.clock = clock;
            this.audit = audit;
            this.settings = settings;
            this.techRepository = techRepository;
        }
        private readonly IClock clock;
        private readonly IEventStore audit;
        private readonly Blue.Cosacs.Service.Settings settings;
        private readonly TechnicianRepository techRepository;

        [HttpPost]
        public JsonResult Get(int id)
        {
            return Json(techRepository.Get(id) ?? techRepository.Create(id), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public void Save(TechnicianProfile t)
        {
            techRepository.Save(t);
        }

        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public ActionResult Diary(int? id)
        {
            GetPermissions();
            return View(id);
        }

        [Permission(ServicePermissionEnum.ViewDiaryExceptions)]
        public ActionResult DiaryExceptions()
        {
            GetPermissions();
            ViewBag.Exceptions = true;
            return View("Diary");
        }


        public JsonResult GetDiary(int id, DateTime start, DateTime end, bool? myDiary)
        {
            var isMyDiary = (myDiary.HasValue && myDiary.Value);
            var deniedMyDiaryView = (!this.GetUser().HasPermission(ServicePermissionEnum.ViewMyDiary) ||
                                        id != this.GetUser().Id);
            var deniedTechnicianDiaryView = (!this.GetUser().HasPermission(ServicePermissionEnum.ViewTechnicianDiary));

            if (isMyDiary && deniedMyDiaryView)
            {
                throw new PermissionException("ViewMyDiary");
            }

            if (!isMyDiary && deniedTechnicianDiaryView)
            {
                throw new PermissionException("ViewTechnicianDiary");
            }

            var retJson = new LargeJsonResult
            {
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                Data = techRepository.GetDiary(id, start, end)
            };

            return retJson;
            //return Json(techRepository.GetDiary(id, start, end), JsonRequestBehavior.AllowGet);
        }


        public JsonResult AddHoliday(int UserId, DateTime from, DateTime to, bool portalUser)
        {
            return Json(techRepository.AddHoliday(UserId, from, to, portalUser));
        }

        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public void ApproveHoliday(int id)
        {
            techRepository.ApproveHoliday(id);
        }

        public void DeleteHoliday(int id)
        {
            techRepository.DeleteHoliday(id);
        }

        [Permission(ServicePermissionEnum.DeleteBookingTechDiary)]
        public void DeleteBooking(int id, string reason)
        {
            techRepository.DeleteBookingById(id, this.GetUser().Id, reason);
        }

        [Permission(ServicePermissionEnum.AddBookingTechDiary)]
        public JsonResult AddBooking(int userId, int requestId, DateTime bookingDate, int slot, int slotExtend)
        {
            var id = techRepository.NewBooking(userId, requestId, bookingDate, slot, slotExtend);
            return Json(new { error = id == 0, id = id }, JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public JsonResult GetTechnicians()
        {
            return Json(techRepository.GetTechnician(), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public JsonResult GetFreeAllocations(FreeTechnicianSearch search)
        {
            return Json(techRepository.FreeAllocation(search), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult RemoveProfile(UserProfile userProfile)
        {
            var removeProfile = true;

            using (var scope = Domain.Context.Read())
            {
                var record = scope.Context.UserProfileView.Where(a => a.ProfileId == userProfile.ProfileId && a.UserId == userProfile.UserId).FirstOrDefault();

                //Check for any open requests
                if (record != null)
                {

                    var openRequests = (from t in scope.Context.TechnicianBooking
                                        join r in scope.Context.Request on t.RequestId equals r.Id
                                        join u in scope.Context.UserProfileView on t.UserId equals u.UserId
                                        where t.UserId == userProfile.UserId
                                        && r.IsClosed == false
                                        && record.Name == "Technician"
                                        select t).FirstOrDefault();

                    if (openRequests == null)
                    {
                        new ProfileRepository(clock).RemoveProfile(userProfile.UserId, userProfile.ProfileId);
                    }
                    else
                    {
                        removeProfile = false;
                    }

                }
                return Json(new { removeProfile = removeProfile });
            }
        }

        [Permission(ServicePermissionEnum.ViewMyDiary)]
        public ActionResult MyDiary()
        {
            GetPermissions();
            ViewBag.PortalUser = this.GetUser().Id;
            ViewBag.RejectLimit = settings.TechDeleteDayLimit;
            return View("Diary");
        }

        [Permission(ServicePermissionEnum.ViewDiaryExceptions)]
        public JsonResult GetExceptions()
        {
            return Json(techRepository.GetExceptions(), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewMyDiary)]
        public void RejectBooking(int id, string reason)
        {
            techRepository.RejectBooking(id, reason, this.GetUser().Id);
        }

        private void GetPermissions()
        {
            var sb = new StringBuilder();
            new Newtonsoft.Json.JsonSerializer().Serialize(new StringWriter(sb), this.GetUser().PermissionIds.Where(p => p >= 1600 && p < 1700));
            ViewBag.PermissionIds = sb.ToString();
        }

        public ActionResult SearchMyJobs(string q = "")
        {
            ViewBag.title = "Search My Jobs";
            ViewBag.buttons = (new
            {
                SummaryPrint = new { enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrSummaryPrint), label = "Summary Print" },
                BatchPrint = new { enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrBatchPrint), label = "Batch Print" },
                Export = new { enabled = this.GetUser().HasPermission(ServicePermissionEnum.SrExport), label = "Export" }
            }).ToJson();
            return View("Search", model: SearchSolr(q));
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0, int rows = 25)
        {
            var result = SearchSolr(q, start, rows);
            Response.Write(result);
        }


        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public JsonResult GetFreeBookings(string query)
        {
            var retJson = new LargeJsonResult
            {
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                Data = techRepository.GetFreeBookings(query)
            };

            return retJson;
            //return Json(techRepository.GetFreeBookings(), JsonRequestBehavior.AllowGet);
        }

        [Permission(ServicePermissionEnum.ViewTechnicianDiary)]
        public JsonResult GetFreeBooking(int requestId)
        {
            return Json(techRepository.GetFreeBooking(requestId), JsonRequestBehavior.AllowGet);
        }

        // Gurpreet - CR2018-010 - 31/10/18 - Setting of max no. of Jobs & Validation with allocated jobs for a technician.
        /// <summary>
        /// Gets the maximum and current number of jobs allocated for a technician
        /// </summary>
        /// <param name="techid"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetMaxAndCurrJobs(int techid)
        {
            return Json(techRepository.GetTechnicianMaxAndCurrentJobs(techid), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Gets the current no of jobs allocated to a technician.
        /// </summary>
        /// <param name="techId"></param>
        /// <returns></returns>
        public JsonResult GetTechnicianJobsAllocation(int techId)
        {
            return Json(techRepository.GetTechnicianJobAllocation(techId), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// To authenticate the user and also to check if the user has the permission to override the job
        /// </summary>
        /// <param name="id"></param>
        /// <param name="pwd"></param>
        /// <returns></returns>
        public JsonResult GetUserAuthForOverride(int id,string pwd)
        {
            return Json(techRepository.GetUserAuthForOverride(id,pwd), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Overrides the user selected job with the new created job for a technician.
        /// </summary>
        /// <param name="techId"></param>
        /// <param name="id"></param>
        public void OverrideBookingByRequestId(int techId, int id)
        {
            techRepository.OverrideBookingByRequestId(techId, id);
        }

        /// <summary>
        /// Audits the job override process done by the user
        /// </summary>
        /// <param name="id"></param>
        /// <param name="newRequestId"></param>
        public void JobOverrideAudit(int id, int newRequestId)
        {
            DateTime overideDate = DateTime.Now;
            techRepository.JobOverrideAudit(id, this.GetUser().Id, overideDate, newRequestId);
        }

        //CR2018-010 Changes End

        private string SearchSolr(string q = "", int start = 0, int rows = 25, string type = "serviceRequest")
        {
            var solrQuery = new Blue.Solr.Query();
            var request = solrQuery.GetSearchRequest(q);

            var technician = new ArrayList();
            technician.Add(this.GetUser().FullName);
            if (request.FacetFieldsOrGroup == null)
            {
                request.FacetFieldsOrGroup = new Dictionary<string, Solr.Request.Filter>();
            }

            request.FacetFieldsOrGroup["TechName"] = new Solr.Request.Filter { Values = technician };

            var t = new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    request,
                    "Type:" + type,
                    facetFields: new[] { "ServiceHomeBranch", "ServiceStatus", "SRType", "Printed", "FaultTags" },
                    showEmpty: false,
                    start: start,
                    rows: rows
                   );

            return t;
        }

    }
}
