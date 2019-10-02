using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace Blue.Cosacs.Web.Models
{
    public class MenuItem
    {
        //public string Title { get; set; }
        //public string Url { get; set; }
        //public List<MenuItem> Items { get; set; }

        [JsonProperty("label")]
        public string Label { get; set; }
        [JsonProperty("url", NullValueHandling = NullValueHandling.Ignore)]
        public string Url { get; set; }
        [JsonProperty("permission", NullValueHandling = NullValueHandling.Ignore)]
        public int? Permission { get; set; }
        [JsonProperty("nodes", NullValueHandling = NullValueHandling.Ignore)]
        public List<MenuItem> Nodes { get; set; }

        private static object sync = new object { };
        private static List<MenuItem> items = null;

        //public override bool Equals(object obj)
        //{
        //    if (base.Equals(obj))
        //    {
        //        return true;
        //    }
        //    var obj2 = obj as MenuItem;
        //    if (obj2 == null)
        //    {
        //        return false;
        //    }
        //    return obj2.Label == this.Label;
        //}

        //public override int GetHashCode()
        //{
        //    return Label.GetHashCode();
        //}

        public static List<MenuItem> Current()
        {
            return Map(SiteMap.RootNode.ChildNodes);
        }

        private static List<MenuItem> Map(SiteMapNodeCollection nodes) //, UserSession session)
        {
            var result = new List<Models.MenuItem>();
            foreach (SiteMapNode n in nodes)
            {
                var permissionString = n["permission"];
                int? permissionId = null;
                if (permissionString != null)
                {
                    permissionId = int.Parse(permissionString);
                }

                result.Add(new Models.MenuItem
                {
                    Label = n.Title,
                    Url = n.Url == string.Empty ? null : n.Url.Replace("~", "/cosacs"),
                    Permission = permissionId,
                    Nodes = Map(n.ChildNodes), //, session),
                });
            }
            if (result.Count == 0)
            {
                return null;
            }
            return result;
        }

        public static List<MenuItem> All()
        {
            lock (sync)
            {
                // load all the sitemaps (and merge) only the first time
                if (items == null)
                {
                    items = Load();
                }
                return items;
            }
        }

        private static List<MenuItem> Load()
        {
            var modules = Get<string[]>("/modules.json"); //.Result;
            var sitemaps = (from module in modules
                            select GetSitemap(string.Format("/{0}/sitemap.json", module)))
                           .ToList();

            //Items that belongs to no module
            sitemaps.Add(new List<MenuItem>()
            {
                new MenuItem
                {
                    Label = "Configuration",
                    Nodes = new List<MenuItem>
                    {
                        new MenuItem
                        {
                            Label = "System Settings",
                            Url=  "#/settings/",
                            Permission = 1202
                        },
                        new MenuItem
                        {
                            Label = "Scheduled Jobs",
                            Url = "#/cron/",
                            Permission = 1901
                        }
                    }
                },
                new MenuItem
                {
                    Label = "Administration",
                    Nodes = new List<MenuItem>
                    {
                        new MenuItem
                        {
                            Label = "Remote Authorisation",
                            Url=  "#/remoteAuthorisation/",
                            Permission = 1208
                        },
                    }
                }
            });

            return Merge(sitemaps); //.Select(t => t.Result).ToList());
        }

        private static List<MenuItem> Merge(List<List<MenuItem>> sitemaps)
        {
            var result = sitemaps.First(); // we merge everything into the first

            foreach (var sitemap in sitemaps.Skip(1))
            {
                Merge(result, sitemap);
            }

            return result;
        }

        // Merge one tree into another.
        private static void Merge(List<MenuItem> into, List<MenuItem> from)
        {
            foreach (var f in from)
            {
                var i = into.Find((x) => x.Label == f.Label);
                if (i != null)
                {
                    if (i.Nodes == null)
                    {
                        i.Nodes = f.Nodes;
                    }
                    else
                    {
                        Merge(i.Nodes, f.Nodes);
                    }
                }
                else
                {
                    into.Add(f);
                }
            }
        }

        //private static async Task<List<MenuItem>> GetSitemap(string path)
        private static List<MenuItem> GetSitemap(string path)
        {
            if (path.ToLower().StartsWith("/cosacs"))
            {
                //return await new Task<List<MenuItem>>(() => Current());
                return Current();
            }
            //return await Get<List<MenuItem>>(path);
            return Get<List<MenuItem>>(path);
        }

        private static T Get<T>(string path)
        {
            var serializer = new Newtonsoft.Json.JsonSerializer();
            var baseAddress = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority);
            var client = new HttpClient() { BaseAddress = new Uri(baseAddress) };

            try
            {
                using (var stream = client.GetStreamAsync(path).Result)
                {
                    using (var reader = new StreamReader(stream))
                    {
                        return (T)serializer.Deserialize(reader, typeof(T));
                    }
                }
            }
            catch (Exception)
            {
                throw new Exception(string.Format("Failed to load {0}{1} for sitemap/menu purposes.", baseAddress, path));
            }
        }
    }
}