using System;
using System.Web.Mvc;
using System.Web.Routing;
using StructureMap;
using System.Data.SqlClient;
using System.Configuration;
using System.Threading;
using System.Collections.Generic;

namespace Blue.Glaucous.Client.Mvc
{
    public class StructureMapControllerFactory : DefaultControllerFactory
    {
        protected override IController GetControllerInstance(RequestContext requestContext, Type controllerType)
        {
            IController instance;
            if (controllerType == null)
            {
                return new Controllers.NotFoundController();
            }

            try
            {
                instance = ObjectFactory.GetInstance(controllerType) as Controller;
            }
            catch (StructureMapException exception)
            {
                throw new StructureMapControllerFactoryException(ObjectFactory.WhatDoIHave(), exception);
            }
            return instance;
        }

        public class StructureMapControllerFactoryException : ApplicationException
        {
            public StructureMapControllerFactoryException(string message, Exception ex) 
                : base(message, ex) 
            { 
            }
        }
    }
}