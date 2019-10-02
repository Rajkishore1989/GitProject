using Blue.Admin;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class SitemapController : Controller
    {
        public void Index()
        {
            Response.ContentType = "application/json";
            Response.Cache.SetCacheability(HttpCacheability.Public);
            Response.Cache.SetExpires(DateTime.Now.AddHours(4));
            Response.Cache.SetMaxAge(new TimeSpan(0, 4, 0, 0));
            new Newtonsoft.Json.JsonSerializer().Serialize(Response.Output, Models.MenuItem.Current()); //, this.GetUser()));
        }
    }
}
