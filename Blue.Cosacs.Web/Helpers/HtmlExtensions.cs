using BarcodeLib;
using Blue.Cosacs.Warehouse;
using Blue.Events;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;
using System.Web.Mvc.Html;
using System.Xml;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Formatting = System.Xml.Formatting;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Helpers
{
    public static class HtmlExtensions
    {
        public static IHtmlString PrettyPrintXml(this HtmlHelper html, string xml)
        {
            using (var mStream = new MemoryStream())
            {
                using (var writer = new XmlTextWriter(mStream, Encoding.Unicode))
                {
                    var document = new XmlDocument();

                    try
                    {
                        // Load the XmlDocument with the XML.
                        document.LoadXml(xml);

                        writer.Formatting = Formatting.Indented;

                        // Write the XML into a formatting XmlTextWriter
                        document.WriteContentTo(writer);
                        writer.Flush();
                        mStream.Flush();

                        // Have to rewind the MemoryStream in order to read
                        // its contents.
                        mStream.Position = 0;

                        // Read MemoryStream contents into a StreamReader.
                        var sReader = new StreamReader(mStream);

                        // Extract the text from the StreamReader.
                        var formattedXml = sReader.ReadToEnd();

                        return MvcHtmlString.Create(html.Encode(formattedXml).Replace(" ", "&nbsp;").Replace("\n", "<br>"));
                    }
                    catch (XmlException)
                    {
                        return MvcHtmlString.Create(html.Encode(xml));// "Invalid message structure: " + ex.Message;
                    }
                }
            }
        }
        public static string Version(this HtmlHelper html)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var assemblyName = assembly.GetName();
            var version = assemblyName.Version;
            var file = HostingEnvironment.MapPath(@"~/_version.txt");

            if (string.IsNullOrEmpty(file)) return version.ToString();

            try
            {
                using (var sr = new StreamReader(file))
                {
                    var line = sr.ReadToEnd();

                    return line;
                }
            }
            catch (Exception ex)
            {

                return version.ToString();
            }
        }

        public static string DefaultBranchName(this HtmlHelper html)
        {
            var branchName = HttpContext.Current.GetUser();
            return (branchName == null ? "" : "Logged In: " + (string.IsNullOrWhiteSpace(branchName.BranchName) ? branchName.Branch.ToString() : branchName.BranchName));
        }

        public static bool IsPjaxEnabled(this HtmlHelper html)
        {
            return pjaxEnabled;
        }

        private static readonly bool pjaxEnabled = bool.Parse(ConfigurationManager.AppSettings["PjaxEnabled"]);

        public static bool IsShell(this HtmlHelper html)
        {
            return IsShell();
        }

        public static bool IsShell()
        {
            return HttpContext.Current.Request.UserAgent != null && HttpContext.Current.Request.UserAgent.Contains("Shell");
        }

        public static bool IsUserBranch(this HtmlHelper html, short branch)
        {
            return HttpContext.Current.GetUser().Branch == branch;
        }

        public static bool HasPermission(this HtmlHelper html, System.Enum permission)
        {
            return HttpContext.Current.GetUser().HasPermission(permission);
        }

        public static IHtmlString RawJson(this HtmlHelper html, string json)
        {
            return html.Raw(HttpUtility.HtmlEncode(json));
        }

    private static readonly JsonSerializerSettings CamelCaseSerializerSettings = new JsonSerializerSettings{ContractResolver=new CamelCasePropertyNamesContractResolver()};
    public static IHtmlString RawJson(this HtmlHelper html, object model)
    {
        if (model == null)
        {
            model = new {};
        }
        return html.Raw(HttpUtility.HtmlEncode(JsonConvert.SerializeObject(model, CamelCaseSerializerSettings)));
    }

        public static MvcHtmlString Barcode(this HtmlHelper html, string value, BarcodeLib.TYPE type, int width, int height, bool label = false, AlignmentPositions align = AlignmentPositions.LEFT, bool rotate = false)
        {
            var url = string.Format("/barcode/{0}/{1}?w={2}&h={3}&label={4}&align={5}&rotate={6}", type, HttpUtility.UrlEncode(value), width, height, label, align, rotate);
            return new MvcHtmlString(string.Format("<img width='{0}' height='{1}' src='{2}' alt='{3}'/>", rotate ? height : width, rotate ? width : height, url, html.Encode(value)));
        }

        public static MvcHtmlString ProfileLink(this HtmlHelper html, string linkText, int userId)
        {
            return html.ActionLink(linkText, "Profile", "Users", new { id = userId }, null);
        }

        public static string ToJson(this HtmlHelper html, object o)
        {
            var sb = new System.Text.StringBuilder();
            new Newtonsoft.Json.JsonSerializer().Serialize(new StringWriter(sb), o);
            return sb.ToString();
        }

        public static MvcHtmlString FileToImage(this HtmlHelper html, Guid? fileId, int width, int height)
        {
            var url = System.Web.Hosting.HostingEnvironment.ApplicationVirtualPath + "/Files/Read/";

            if (!fileId.HasValue || fileId == new Guid(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
            {
                return new MvcHtmlString(string.Format("<div style=\"width:{0}px;height={1}px\"><span> &nbsp; </span></div>", width, height));
            }

            return new MvcHtmlString(string.Format("<img alt='Logo' width='{0}px' height='{1}px' src='{2}' />", width, height, url + fileId.Value));
        }

        public static MvcHtmlString GetNonStockServicesHtml<T>(this HtmlHelper<T> html, INonStocksService nonStock)
        {
            if (nonStock != null)
            {
                var nonStockType = new Dictionary<string, string>() {
                {"inst", "Installation"},
                {"assembly", "Assembly"}}
                .ToLookup(f => f.Key, g => g.Value);

                var glyphicon = string.Empty;
                if (nonStock.NonStockServiceType == "inst")
                    glyphicon = "wrench";
                if (nonStock.NonStockServiceType == "assembly")
                    glyphicon = "settings";

                var typeDesc = nonStockType[nonStock.NonStockServiceType].FirstOrDefault();
                if (typeDesc != null)
                {
                    var retString = string.Format(@"<div><span class=""glyphicons {0}"" title=""{1}"">&nbsp; <strong>{1} {2}</strong> {3}</span></div>",
                        glyphicon,
                        typeDesc,
                        html.Encode(nonStock.NonStockServiceItemNo),
                        html.Encode(nonStock.NonStockServiceDescription));

                    return new MvcHtmlString(retString);
                }
            }

            return new MvcHtmlString(string.Empty);
        }
        #region Audit Json 2 Html helpers
        public static void JsonToHtml(this HtmlHelper html, IEvent e)
        {
            var json = Blue.Events.EventExtensions.ToJson(e); //.ToJson();
            var w = html.ViewContext.Writer;

            JsonToHtml(html, w, json);
        }

        private static void JsonToHtml(HtmlHelper html, TextWriter w, JToken o)
        {
            switch (o.Type)
            {
                case JTokenType.Array: JsonToHtml(html, w, (JArray)o); break;
                case JTokenType.Object: JsonToHtml(html, w, (JObject)o); break;
                case JTokenType.Property: JsonToHtml(html, w, (JProperty)o); break;

                case JTokenType.None: break;
                case JTokenType.Null: break;

                case JTokenType.Boolean: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.Bytes: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.Date: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.Float: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.Guid: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.Integer: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.String: JsonToHtml(html, w, (JValue)o); break;
                case JTokenType.TimeSpan: JsonToHtml(html, w, (JValue)o); break;
            }
        }

        private static void JsonToHtml(HtmlHelper html, TextWriter w, JObject o)
        {
            w.Write("<div class=fs>");
            foreach (var token in o.Children())
                JsonToHtml(html, w, token);
            w.Write("</div>");
        }

        private static void JsonToHtml(HtmlHelper html, TextWriter w, JProperty p)
        {
            // <div class=field><div class=name>${name}</div><div class=value>${value}</div></div>
            w.Write("<div class=f><div class=n>");
            w.Write(html.Encode(Blue.Helpers.Humanize(p.Name)));
            w.Write("</div><div class=v>");
            JsonToHtml(html, w, p.Value);
            w.Write("</div></div>");
        }

        private static void JsonToHtml(HtmlHelper html, TextWriter w, JArray a)
        {
            if (IsTable(a))
            {
                w.Write("<table class=t><thead><tr>");
                var cols = TableColumns(a);
                foreach (var col in cols)
                {
                    w.Write("<th>");
                    w.Write(html.Encode(Blue.Helpers.Humanize(col)));
                    w.Write("</th>");
                }

                w.Write("</tr></thead><tbody>");
                foreach (var item in a)
                {
                    w.Write("<tr>");
                    foreach (var col in cols)
                    {
                        var v = (JValue)item[col];
                        w.Write("<td>");
                        JsonToHtml(html, w, v);
                        w.Write("</td>");
                    }
                    w.Write("</tr>");
                }
                w.Write("</tbody></table>");
                return;
            }

            // if is not table
            w.Write("<div class=a>");
            var i = 0;
            foreach (var item in a)
            {
                w.Write("<div class=ai>");
                w.Write("<span>[");
                w.Write(++i);
                w.Write('/');
                w.Write(a.Count);
                w.Write("]</span>");
                JsonToHtml(html, w, item);
                w.Write("</div>");
            }
            w.Write("</div>");
        }

        /// <summary>
        /// Detect if array is a table (meaning it's not deep, only has scalars in the row objects)
        /// </summary>
        private static bool IsTable(JArray a)
        {
            foreach (var item in a)
                if (!IsShallow(item))
                    return false;
            return true;
        }

        private static HashSet<string> TableColumns(JArray a)
        {
            var cols = new HashSet<string>();
            foreach (var item in a)
            {
                foreach (JProperty property in item.Children())
                {
                    if (!cols.Contains(property.Name))
                        cols.Add(property.Name);
                }
            }
            return cols;
        }

        private static bool IsShallow(JToken o)
        {
            foreach (var token in o.Children())
            {
                if (token.Type != JTokenType.Property)
                    return false;
                var property = (JProperty)token;
                if (!(property.Value is JValue))
                    return false;
            }
            return true;
        }

        private static void JsonToHtml(HtmlHelper html, TextWriter w, JValue v)
        {
            if (v.Type == JTokenType.Date)
            {
                var d = (DateTime)v.Value;
                w.Write(d.ToString(d.Date == d ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm:ss"));
            }
            else w.Write(html.Encode(v.Value));

            /*
            var matchDate = /\/Date\((\d+)((\+|\-)\d{4})\)\//.exec(value);
            if (matchDate != null) {
                var ticks = parseInt(matchDate[1]);
                var timezone = matchDate[2];
                var date = new Date(ticks);
                if (isValidDate(date)) {
                    value = date.format('yyyy-mm-dd HH:MM:ss');
                    if (timezone != "+0000")
                        value += timezone
                }
            }
            */
        }

        //private static string Humanize(string s)
        //{
        //    var sb = new StringBuilder();
        //    var previous = ' ';
        //    foreach (var c in s)
        //    {
        //        if (sb.Length == 0)
        //            sb.Append(char.ToUpper(c));
        //        else if (char.IsUpper(c) && !(previous == 'I' && c == 'D'))
        //            sb.Append(' ').Append(c);
        //        else
        //            sb.Append(c);
        //        previous = c;
        //    }
        //    return sb.ToString();
        //}
        #endregion
    }
}