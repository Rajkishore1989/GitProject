using System;
using System.Web.Mvc;

namespace Blue.Glaucous.Client.Mvc
{
    public class HandleErrorInfoExtended : HandleErrorInfo
    {
        public HandleErrorInfoExtended(Exception ex, string controllerName, string actionName)
            : base(ex, controllerName, actionName)
        {
        }

        public string ErrorLogId
        {
            get;
            set;
        }
    }
}
