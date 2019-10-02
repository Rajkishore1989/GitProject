using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.SessionState;
using Blue.Admin;
using Newtonsoft.Json;
using System;

//namespace Blue.Glaucous.Client.Mvc
//{
    public static class ControllerExtensions2
    {
        private const string UserSessionKey = "UserSessionKey";

        /// <summary>
        /// Returns the current Admin.User.Id stored in the cookie during Web login. It may not be available in other contexts.
        /// </summary>
        public static int UserId(this Controller controller)
        {
            return controller.GetUser().Id;
            //return Convert.ToInt32(controller.HttpContext.User.Identity.Name);
        }

        public static short UserDefaultBranch(this Controller controller)
        {
            return controller.GetUser().Branch;
        }
        public static UserSession GetUser(this Controller controller)
        {
            return Current(); // (UserSession)controller.Session[UserSessionKey];
        }

        public static UserSession GetUser(this HttpContextBase context)
        {
            return Current();
            //if (context.Session != null)
            //{ 
            //    return (UserSession)context.Session[UserSessionKey];
            //}

            //return null;
        }

        private static UserSession Current()
        {
            return StructureMap.ObjectFactory.GetInstance<ISessionManager>().Current();
        }

        public static UserSession GetUser(this HttpContext context)
        {
            return Current(); // (UserSession)context.Session[UserSessionKey];
        }

        //public static UserSession SetUser(this Controller controller, UserSession session)
        //{
        //    return SetUser(controller.HttpContext, session);
        //}

        //public static UserSession SetUser(this HttpContextBase context, UserSession session)
        //{
        //    if (context.Session != null)
        //    {
        //        context.Session[UserSessionKey] = session;
        //    }

        //    return session;
        //}
    }
//}