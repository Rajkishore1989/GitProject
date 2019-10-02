using Blue.Glaucous.Client.Mvc;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Blue.Cosacs.Web.Common
{
    public class RetryDeadlockControllerFactory : StructureMapControllerFactory
    {
        protected override IController GetControllerInstance(RequestContext requestContext, Type controllerType)
        {
            var controller = base.GetControllerInstance(requestContext, controllerType);
            if ((controller as Controller) != null)
            {
                ((Controller)controller).ActionInvoker = new RetryDeadlockActionInvoker();
            }
            return controller;
        }
    }

    public class RetryDeadlockActionInvoker : ControllerActionInvoker
    {
        static RetryDeadlockActionInvoker()
        {
            ActionRetryDeadlockSleepInMs = int.Parse(ConfigurationManager.AppSettings["ActionRetryDeadlockSleepInMs"]);
            ActionRetryDeadlockMaxAttempts = int.Parse(ConfigurationManager.AppSettings["ActionRetryDeadlockMaxAttempts"]);
            Log = global::log4net.LogManager.GetLogger(typeof(RetryDeadlockActionInvoker));
        }

        private static readonly int ActionRetryDeadlockSleepInMs;
        private static readonly int ActionRetryDeadlockMaxAttempts;
        private static readonly global::log4net.ILog Log;

        protected override ActionResult InvokeActionMethod(
            ControllerContext controllerContext,
            ActionDescriptor actionDescriptor,
            IDictionary<string, object> parameters)
        {
            // disable retry mechanism
            if (ActionRetryDeadlockSleepInMs <= 0 || ActionRetryDeadlockMaxAttempts <= 1)
            {
                return base.InvokeActionMethod(controllerContext, actionDescriptor, parameters);
            }

            // retry enabled
            for (var attempts = 1; ; attempts++)
            {
                try
                {
                    return base.InvokeActionMethod(controllerContext, actionDescriptor, parameters);
                }
                catch (SqlException ex)
                {
                    // Deadlock 
                    if (ex.Number == 1205 && attempts < ActionRetryDeadlockMaxAttempts)
                    {
                        Log.WarnFormat(
                            "Retrying {0}.{1} due to deadlock, attempt {2}.",
                            actionDescriptor.ControllerDescriptor.ControllerName,
                            actionDescriptor.ActionName,
                            attempts + 1);
                        Thread.Sleep(ActionRetryDeadlockSleepInMs);
                        continue;
                    }
                    else
                    {
                        throw;
                    }
                }
            }
        }
    }
}
