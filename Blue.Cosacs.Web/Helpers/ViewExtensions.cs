
public static class ViewExtensions
{
    public static void LayoutMode(System.Web.Mvc.ViewStartPage view)
    {
        var request = view.Request;
        var returnPartialView = (string.Compare(request.Headers["X-PJAX"], "true", true) == 0) || (string.Compare(request.Headers["X-Requested-With"], "XMLHttpRequest", true) == 0);
        view.Layout = returnPartialView ? "~/Views/Shared/_Partial.cshtml" : "~/Views/Shared/_Layout.cshtml";
    }
}
