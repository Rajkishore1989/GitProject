using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Blue.Cosacs.Web.Controllers;

namespace Blue.Cosacs.Web
{
    public partial class Site1 : System.Web.UI.MasterPage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        public static void RenderPartial(string partialName, object model = null)
        {
            //get a wrapper for the legacy WebForm context
            var httpCtx = new HttpContextWrapper(System.Web.HttpContext.Current);

            //create a mock route that points to the empty controller
            var rt = new RouteData();
            rt.Values.Add("controller", "WebFormController");

            //create a controller context for the route and http context
            var ctx = new ControllerContext(
                new RequestContext(httpCtx, rt), new HomeController());

            //find the partial view using the viewengine
            var view = ViewEngines.Engines.FindPartialView(ctx, partialName).View;

            var @out = System.Web.HttpContext.Current.Response.Output;
            //create a view context and assign the model
            var vctx = new ViewContext(ctx, view,
                new ViewDataDictionary { Model = model },
                new TempDataDictionary(), @out);

            //render the partial view
            view.Render(vctx, @out);
            //view.Render(vctx, System.Web.HttpContext.Current.Response.Output);
        }
    }
}