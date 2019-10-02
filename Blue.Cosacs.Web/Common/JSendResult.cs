using System;
using System.Dynamic;
using System.Net;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Blue.Cosacs.Web.Common
{
    public enum JSendStatus
    {
        Success,
        BadRequest,
        Error
    }

    public class JSendResult : JsonResult
    {
        private readonly JSendStatus status;
        private readonly object data;
        private readonly string message;
        private readonly string code;

        private readonly bool camelCase;

        private static readonly JsonSerializerSettings CamelCaseSerializerSettings = new JsonSerializerSettings { ContractResolver = new CamelCasePropertyNamesContractResolver() };

        /// <summary>
        /// Specification at http://labs.omniti.com/labs/jsend
        /// 
        /// success - status, data              - All went well, and (usually) some data was returned.
        /// fail    - status, data              - There was a problem with the data submitted, or some pre-condition of the API call wasn't satisfied
        /// error   - status, message, (code)   - An error occurred in processing the request, i.e. an exception was thrown
        /// </summary>
        /// <param name="status">"success", "fail" or "error"</param>
        /// <param name="data">object will be serialized to json with property names converted to pascal case (lowercase first letter)</param>
        /// <param name="message">A meaningful, end-user-readable (or at the least log-worthy) message, explaining what went wrong.</param>
        /// <param name="code">A numeric code corresponding to the error, if applicable</param>
        /// <param name="camelCase">Will convert property names to camelCase</param>
        public JSendResult(JSendStatus status, object data = null, string message = null, string code = null, bool camelCase = true)
        {
            this.status = status;
            this.data = data;
            this.message = message;
            this.code = code;
            this.camelCase = camelCase;
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

            response.StatusCode = (int)GetResponseStatusCode();

            dynamic jsendResponse = new ExpandoObject();
            jsendResponse.status = GetStatusFromEnum();
            if (this.data != null)
            {
                jsendResponse.data = this.data;
            }
            if (!string.IsNullOrWhiteSpace(this.message))
            {
                jsendResponse.message = this.message;
            }
            if (!string.IsNullOrWhiteSpace(this.code))
            {
                jsendResponse.code = this.code;
            }

            var serializedObject = 
                camelCase
                    ? JsonConvert.SerializeObject(jsendResponse, CamelCaseSerializerSettings)
                    : JsonConvert.SerializeObject(jsendResponse);
            response.Write(serializedObject);
        }

        private HttpStatusCode GetResponseStatusCode()
        {
            switch (this.status)
            {
                case JSendStatus.Success:
                    return HttpStatusCode.OK;
                case JSendStatus.BadRequest:
                    return HttpStatusCode.BadRequest;
                default:
                    return HttpStatusCode.InternalServerError;
            }
        }

        private string GetStatusFromEnum()
        {
            switch (this.status)
            {
                case JSendStatus.Success:
                    return "success";
                case JSendStatus.BadRequest:
                    return "fail";
                default:
                    return "error";
            }
        }
    }
}