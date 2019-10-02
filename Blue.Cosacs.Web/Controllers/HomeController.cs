using System.Web.Mvc;
using System;

namespace Blue.Cosacs.Web.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Test()
        {
            return View();
        }

        public ActionResult Throw()
        {
            throw new InvalidOperationException("This a an action that throws a server error for testing purposes.");
        }

        public ActionResult Timeout()
        {
            throw new ApplicationException("This a sample Timeout exception for testing purposes.");
        }

        public ViewResult Deadlock()
        {
            var cn = System.Configuration.ConfigurationManager.ConnectionStrings["Default"].ConnectionString;

            using (var c = new System.Data.SqlClient.SqlConnection(cn))
            {
                c.Open();
                //using (var t = c.BeginTransaction())
                //{
                using (var cmd = new System.Data.SqlClient.SqlCommand())
                {
                    //    cmd.Transaction = t;
                    cmd.Connection = c;
                    cmd.CommandText = @"

                    BEGIN TRANSACTION

                     UPDATE mytable SET col1 = col1 + 1
                     WAITFOR DELAY '00:00:15' -- Wait for 5 ms
                     UPDATE mytable2 SET col1 = col1 + 1

                     COMMIT TRANSACTION

                    ";
                    cmd.ExecuteNonQuery();
                    // }
                }
            }

            return View("Index");
        }

        public ActionResult Styles() 
        {
            return View();
        }

        public ActionResult StylesInteractive()
        {
            ViewBag.StylesInteractivePage = true;
            return View("Styles");
        }

        public ActionResult Pos() 
        {
            return View();
        }
    }
}
