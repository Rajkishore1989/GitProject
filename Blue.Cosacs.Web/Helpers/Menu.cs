using Blue.Admin;
using Blue.Cosacs.Web.Models;
using Blue.Glaucous.Client.Mvc;
using System.Linq;
using System.Web;

public class Menu : Artemis.Runtime.Web.Menu
{
    public Menu()
        : base(System.Web.HttpContext.Current, search: false, notifications: false, tutorial: false)
    {
        LogOffUrl = "/api/Logout";
        ProfileUrl = "Admin/Profile";
    }

    private Blue.Admin.UserSession User()
    {
        return System.Web.HttpContext.Current.GetUser();
    }

    private bool IsAnyChildVisible(MenuItem node, UserSession session)
    {
        if (node.Nodes != null && node.Nodes.Any())
        {
            foreach (var child in node.Nodes)
            {
                if (IsAnyChildVisible(child, session))
                    return true;
            }
        }
        return IsVisible(node, session) && !string.IsNullOrEmpty(node.Url);
    }

    //public List<MenuItem> GetMenuItems()
    //{
    //    var sitemap = MenuItem.All();
    //    var menuItems = new List<MenuItem>();
    //    //var nodes = 

    //    foreach (var firstLevel in sitemap) // SiteMapNode firstLevel in SiteMap.RootNode.ChildNodes)
    //    {
    //        if (!IsVisible(firstLevel))
    //        {
    //            continue;
    //        }

    //        if (!IsAnyChildVisible(firstLevel) && string.IsNullOrEmpty(firstLevel.Url))
    //        {
    //            continue;
    //        }

    //        if (firstLevel.Nodes == null || firstLevel.Nodes.Count == 0)
    //        {
    //            menuItems.Add(firstLevel); // new MenuItem { Label = firstLevel.Title, Url = firstLevel.Url });
    //        }
    //        else
    //        {
    //            var menuItemLevel1 = new MenuItem { Label = firstLevel.Label, Url = firstLevel.Url, Nodes = new List<MenuItem>() };
    //            foreach (var secondLevel in firstLevel.Nodes) //.ChildNodes)
    //            {
    //                //if (!secondLevel.CanUserAccess(context))
    //                //{
    //                //    continue;
    //                //}

    //                if (!IsVisible(secondLevel))
    //                {
    //                    continue;
    //                }

    //                var menuItemLevel2 = new MenuItem { Label = secondLevel.Label, Url = secondLevel.Url, Nodes = new List<MenuItem>() };
    //                menuItemLevel1.Nodes.Add(menuItemLevel2);

    //                if (secondLevel.Nodes != null && secondLevel.Nodes.Count > 0)
    //                {
    //                    menuItemLevel2.Nodes.AddRange(
    //                        secondLevel.Nodes
    //                            .Where(p => IsVisible(p))
    //                            .OrderBy(p => p.Label)
    //                            .Select(p => new MenuItem { Label = p.Label, Url = p.Url }));
    //                }
    //            }
    //            menuItems.Add(menuItemLevel1);
    //        }
    //    }

    //    return menuItems;
    //}

    //public override System.Web.Mvc.MvcHtmlString RenderToString()
    //{
    //    return base.RenderToString();
    //}

    private bool IsVisible(MenuItem node, UserSession session)
    {
        if (session == null)
            return false;

        if (node.Permission == null)
        {
            return true;
        }
        return session.HasPermission(node.Permission.Value);
    }

    //protected override bool IsVisible(SiteMapNode node)
    //{
    //    var user = User();
    //    if (user == null)
    //        return false;

    //    var permissionString = node["permission"];
    //    if (permissionString == null)
    //        return true;

    //    var permissionId = int.Parse(permissionString);
    //    return user.HasPermission(permissionId);
    //}

    protected override void OnRendering(Artemis.Runtime.Web.Menu.IOutput @out)
    {
        @out.Write("<div class=\"nav-collapse navbar-inverse-collapse\">");
    }

    protected override void OnRendered(IOutput @out)
    {
        @out.Write("</div>");
    }

    private static string Encode(string s)
    {
        return HttpUtility.HtmlEncode(s);
    }

    private string Link(MenuItem node)
    {
        var url = "#";
        var @class = "";
        if (node.Nodes == null || node.Nodes.Count == 0)
        {
            url = node.Url;
            if (node.Url.StartsWith("#/"))
            {
                url = "/" + node.Url;
                @class = " class='pjax-off'";
            }
        }
        return string.Format("<a href='{0}'{2}>{1}</a>", url, Encode(node.Label), @class);
    }

    protected override void RenderNodes(IOutput @out)
    {
        @out.Write("<ul class=\"nav navbar-nav\">");
        var session = HttpContext.Current.GetUser();
        var sitemap = MenuItem.All();

        foreach (var firstLevel in sitemap) // SiteMap.RootNode.ChildNodes)
        {
            if (!IsVisible(firstLevel, session))
                continue;

            if (!IsAnyChildVisible(firstLevel, session))
                continue;

            //OnNodeRendering(firstLevel, @out);

            if (firstLevel.Nodes == null || firstLevel.Nodes.Count == 0)
            {
                @out.Write("<li>");
                @out.Write(Link(firstLevel));
            }
            else
            {
                @out.Write("<li class=\"dropdown\">");
                @out.Write("<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">" + Encode(firstLevel.Label) + " <b class=\"caret\"></b></a>");
                @out.Write("<ul class=\"dropdown-menu\">");

                foreach (var secondLevel in firstLevel.Nodes)
                {
                    if (!IsVisible(secondLevel, session))
                        continue;

                    //OnNodeRendering(secondLevel, @out);

                    if (secondLevel.Nodes != null && secondLevel.Nodes.Count > 0)
                    {
                        @out.Write("<li class=\"dropdown-submenu\">");

                        var thirdLevel = secondLevel.Nodes
                            .Where(p => IsVisible(p, session)).ToList();

                        if (thirdLevel.Count() != 0)
                        {
                            @out.Write(string.Format("<a href=\"#\" class=\"dropdown-toggle\">{0}</b></a>", secondLevel.Label));
                        }

                        @out.Write("<ul class=\"dropdown-menu\">");

                        foreach (var item in thirdLevel)
                        {
                            @out.Write("<li>");
                            @out.Write(Link(item));
                            @out.Write("</li>");
                        }
                        @out.Write("</ul>");
                    }
                    else
                    {
                        @out.Write("<li>");
                        @out.Write(Link(secondLevel));
                    }
                    @out.Write("</li>");
                    //OnNodeRendered(secondLevel, @out);
                }
                @out.Write("</ul>");
            }

            @out.Write("</li>");
            //OnNodeRendered(firstLevel, @out);
        }
        @out.Write("</ul>");
    }

    protected override void RenderSecondary(IOutput @out)
    {
        var user = User();
        if (user != null)
        {
            var shell = Blue.Cosacs.Web.Helpers.HtmlExtensions.IsShell();

            var context = HttpContext.Current;
            var rootUrl = (context.Request.ApplicationPath == "/" ? "" : context.Request.ApplicationPath);
            var logOffUrl = LogOffUrl.Replace("~", rootUrl);

            @out.Write("<ul class=\"nav navbar-nav navbar-right\">");
            @out.Write(
                "<li><span id=\"loader\">&nbsp;</span></li>" +
                //"<li><a class=\"menu-icon\" id=\"menu-hud-open\" href='{0}/' title='Menu Search (Alt + G)'><span class=\"glyphicons binoculars\"></span></a></li>" +
                "<li><a class=\"menu-icon\" id=\"home\" href='/' title='Home (Alt + H)'><span class=\"glyphicons home\"></span></a></li>" +
                (!string.IsNullOrWhiteSpace(ProfileUrl) && user != null ? "<li><a class=\"menu-icon\" id=\"profile\" href=\"{0}/{2}\" title='My Profile and Settings'><span class=\"glyphicons user\"></span></a></li>" : "") +
                (!shell && user != null ? "<li><a class=\"menu-icon\" id=\"logoff\" href=\"{1}\" title=\"Log Off  (Alt + L)\" rel=\"nofollow\"><span class=\"glyphicons log_out\"></span></a></li>" : ""),
                rootUrl, logOffUrl, ProfileUrl);
            @out.Write("</ul>");
        }
    }
}
