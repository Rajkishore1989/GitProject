using System;
using System.Web.Script.Serialization;

namespace System.Web.Mvc
{
    public class LargeJsonResult : JsonResult
    {
        const string JsonRequestGetNotAllowed = "This request has been blocked because sensitive information could be disclosed to third party web sites when this is used in a GET request. To allow GET requests, set JsonRequestBehavior to AllowGet.";

        public LargeJsonResult()
        {
            MaxJsonLength = int.MaxValue;
            RecursionLimit = 100;
        }

        public int MaxJsonLength { get; set; }
        public int RecursionLimit { get; set; }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }
            if (JsonRequestBehavior == JsonRequestBehavior.DenyGet &&
                String.Equals(context.HttpContext.Request.HttpMethod, "GET", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(JsonRequestGetNotAllowed);
            }

            var response = context.HttpContext.Response;

            response.ContentType = !String.IsNullOrEmpty(ContentType) ? ContentType : "application/json";

            if (ContentEncoding != null)
            {
                response.ContentEncoding = ContentEncoding;
            }

            if (Data == null) return;

            var serializer = new JavaScriptSerializer { MaxJsonLength = MaxJsonLength, RecursionLimit = RecursionLimit };
            response.Write(serializer.Serialize(Data));
        }
    }
}