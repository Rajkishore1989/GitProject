using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Blue.Config;
using Blue.Config.Repositories;
using Newtonsoft.Json;
using Blue.Events;
using Blue.Config.Event;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Config.Controllers
{
    public class DecisionTableController : Controller
    {
        private readonly DecisionTableRepository repository;
        private readonly IEventStore audit;

        public DecisionTableController(DecisionTableFileRepository repository, IEventStore audit)
        {
            this.repository = repository;
            this.audit = audit;
        }

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.DecisionTable)]
        public ActionResult Index()
        {
            ViewBag.Keys = repository.Keys();
            return View();
        }

        [HttpGet]
        public void Download(string key)
        {
            var record = repository.LoadByKey(key);

            dynamic parsedJson = JsonConvert.DeserializeObject(record.Value);
            var json = JsonConvert.SerializeObject(parsedJson, Formatting.Indented);
            var bytes = Encoding.UTF8.GetBytes(json);

            var fileName = key + ".json";
            var fileSize = bytes.Length;

            var response = this.Response;
            response.ContentType = "application/json";
            response.AddHeader("Content-Length", fileSize.ToString());
            response.AddHeader("Content-Disposition", "attachment; filename=" + fileName);
            response.Cache.SetLastModified(record.CreatedUtc);

            response.OutputStream.Write(bytes, 0, bytes.Length);
            response.End();
            audit.LogAsync(new { table = record }, EventType.DecisionTableExport, EventCategory.DecisionTable, new { User = this.User.Identity, Type = key });
        }

        [HttpPost]
        public JsonResult Upload(string key, HttpPostedFileBase file)
        {
            if (!string.IsNullOrWhiteSpace(key) && file != null && file.ContentLength > 0)
            {
                var fileName = Path.GetFileName(file.FileName);
                using (var sr = new StreamReader(file.InputStream))
                {
                    var json = sr.ReadToEnd();
                    repository.SaveByKey(key, json);
                    audit.LogAsync(new { table = json }, EventType.DecisionTableImport, EventCategory.DecisionTable, new { User = this.User.Identity, Type = key });
                    return Load(new[] { key });
                }
            }

            return Json(new DecisionTable[] { });
        }

        [HttpPost]
        public JsonResult Load(string[] decisionTableTypes)
        {
            var query = from dtt in decisionTableTypes
                        select repository.LoadByKey(dtt);

            return Json(query.ToList());
        }

        [HttpPost]
        public void Save(string decisionTableType, string decisionTableJson)
        {
            repository.SaveByKey(decisionTableType, decisionTableJson);
            audit.LogAsync(new { table = decisionTableJson }, EventType.DecisionTableImport, EventCategory.DecisionTable, new { User = this.User.Identity, Type = decisionTableType });
        }
    }
}


