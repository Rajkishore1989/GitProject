using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Blue.Cosacs.Web
{
    public class HackClass
    {
        public HackClass()
        {
            using (var x = new Microsoft.AnalysisServices.AdomdClient.AdomdConnection())
            { }
        }
    }
}