using System.IO;
using System.IO.Compression;
using System.Web.Mvc;
using System.Xml.Serialization;

namespace Blue.Cosacs.Web.Controllers
{
    public abstract class HttpHubSubscriberController<T> : Controller where T : class
    {
        private const string gzip = "gzip";
        public void Index()
        {

            var id = int.Parse(this.Request.Headers["X-Hub-Message-Id"]);
            var isCompressed = this.Request.Headers["Accept-Encoding"] != null && this.Request.Headers["Accept-Encoding"].ToLower().Contains(gzip);

            if (isCompressed)
            {
                using (var decompress = new GZipStream(this.Request.GetBufferedInputStream(), CompressionMode.Decompress))
                {
                    ProcessMessage(decompress, id);
                }
            }
            else
            {
                using (var stream = this.Request.GetBufferedInputStream())
                {
                    ProcessMessage(stream, id);
                }
            }
        }

        private void ProcessMessage(Stream input, int id)
        {
            var message = (T)new XmlSerializer(typeof(T)).Deserialize(input);
            this.Sink(id, message);
        }

        protected abstract void Sink(int id, T message);
    }
}
