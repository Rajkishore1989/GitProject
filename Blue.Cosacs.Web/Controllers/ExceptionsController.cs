using System.Web.Mvc;
using System.Web.Security;
using System.IO;

namespace Blue.Cosacs.Web.Controllers
{
    public class ExceptionsController : Controller
    {
        [HttpPost]
        public void Index(string message, string scriptUrl, string line, string documentUrl)
        {
            var log = global::log4net.LogManager.GetLogger("JavaScript");
            var info = new
            {
                message = message,
                scriptUrl = scriptUrl,
                line = line,
                documentUrl = documentUrl,
                agent = Request.UserAgent,
                clientHostAddress = Request.UserHostAddress,
                clientHostName = Request.UserHostName,
                login = (User.Identity != null ? User.Identity.Name : string.Empty)
            };

            var sw = new StringWriter();
            new Newtonsoft.Json.JsonSerializer() { Formatting = Newtonsoft.Json.Formatting.None }.Serialize(sw, info);
            log.ErrorFormat("[JavaScript error] {0}", sw);
        }
    }
}
