// http://stackoverflow.com/questions/7109967/using-json-net-as-default-json-serializer-in-asp-net-mvc-3-is-it-possible/7150912#7150912
// Modified for optional serialization settings
using System;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Blue.Cosacs.Web.Common
{
    public class JsonNetResult : JsonResult
    {
        private static readonly JsonSerializerSettings CamelCaseSerializerSettings = new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() };

        private readonly JsonSerializerSettings settings;

        public JsonNetResult()
        {
            this.settings = CamelCaseSerializerSettings;
        }

        public JsonNetResult(object data, JsonSerializerSettings settings = null)
        {
            Data = data;
            this.settings = settings ?? CamelCaseSerializerSettings;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            var response = context.HttpContext.Response;

            response.ContentType = !string.IsNullOrEmpty(ContentType)
                ? ContentType
                : "application/json";

            if (ContentEncoding != null)
            {
                response.ContentEncoding = ContentEncoding;
            }

            var serializedObject = JsonConvert.SerializeObject(Data, this.settings);
            response.Write(serializedObject);
        }
    }
}