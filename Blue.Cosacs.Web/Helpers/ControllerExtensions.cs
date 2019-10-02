using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.SessionState;
using Blue.Admin;
using System.IO;
using Newtonsoft.Json;

namespace Blue.Cosacs.Web.Helpers
{
    public static class ControllerExtensions
    {
        public static System.Tuple<string, ModelErrorCollection>[] ErrorsToArray(this ModelStateDictionary modelState)
        {
            return modelState.Where(x => x.Value.Errors.Count > 0).Select(x => new System.Tuple<string, ModelErrorCollection>(x.Key, x.Value.Errors)).ToArray();
        }

        public static IEnumerable<String> GetErrors(this ModelStateDictionary modelState)
        {
            return modelState.Values.SelectMany(v => v.Errors)
                                .Select(v => v.ErrorMessage + " " + v.Exception).ToList();
        }

        /// <summary>
        /// Serialize an object to JSON 
        /// </summary>
        /// <param name="value">Object to serialize</param>
        /// <returns>return a <c>system.string</c> with the object serialized</returns>
        public static string ToJson(this object value)
        {
            using (var stringWriter = new StringWriter())
            {
                using (var writer = new JsonTextWriter(stringWriter))
                {
                    writer.StringEscapeHandling = StringEscapeHandling.EscapeHtml;

                    new JsonSerializer().Serialize(writer, value);
                    writer.Close();
                }
                return stringWriter.ToString();
            }
        }
    }
}