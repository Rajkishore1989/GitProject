using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Linq;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;

    public class TopSkuReportController : Controller
    {
        private readonly ICacheProvider cache;
        private readonly ITopSkuReportRepository reportRepository;
        private readonly ILocationRepository locationRepository;
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public TopSkuReportController(ITopSkuReportRepository reportRepo, ICacheProvider reportCache, ILocationRepository locationRepo, IMerchandisingHierarchyRepository hierarchyRepo)
        {
            reportRepository = reportRepo;
            locationRepository = locationRepo;
            hierarchyRepository = hierarchyRepo;
            cache = reportCache;
        }

        [Permission(Cosacs.Report.ReportPermissionEnum.TopSku)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost, Permission(Cosacs.Report.ReportPermissionEnum.TopSku)]
        public JSendResult Search(TopSkuSearchModel search)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, ModelState.GetErrors());
            }
            var result = reportRepository.TopSkuReport(search);
            var printModel = new TopSkuPrintViewModel() { Query = search, Levels = result.Levels, Locations = result.Locations };
            result.SearchKey = cache.Insert(search, printModel);
            return new JSendResult(JSendStatus.Success, result);
        }

        [HttpGet, Permission(Cosacs.Report.ReportPermissionEnum.TopSku)]
        public ActionResult Print(string searchKey)
        {
            var previousSearch = cache.Get<TopSkuPrintViewModel>(searchKey);

            if (previousSearch != null)
            {
                previousSearch.Query.HierarchyString =
                    hierarchyRepository.GetSelectionString(previousSearch.Query.Hierarchy);
                if (previousSearch.Query.LocationId != null)
                {
                    previousSearch.Query.Location = locationRepository.Get(previousSearch.Query.LocationId.Value).Name;
                }
            }
            return View("Print", previousSearch);
        }

        [HttpGet, Permission(Cosacs.Report.ReportPermissionEnum.TopSku)]
        public FileResult Export(string searchKey)
        {
            var previousSearch = cache.Get<TopSkuPrintViewModel>(searchKey);
            if (previousSearch != null)
            {
                var stream = new MemoryStream();
                var writer = new StreamWriter(stream);
                DynamicFileExporter.WriteToStream(
                    reportRepository.GetTopSkuExport(previousSearch.Levels, previousSearch.Locations).ToList(),
                    writer,
                    ",",
                    true);

                writer.Flush();
                stream.Seek(0, SeekOrigin.Begin);
                return File(stream, System.Net.Mime.MediaTypeNames.Text.Plain, string.Format("TopSkuReport-{0}.csv", DateTime.Now.Ticks));
            }
            return null;
        }
    }
}
