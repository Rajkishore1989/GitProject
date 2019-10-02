using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Rep = Blue.Cosacs.Report;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class WarrantySalesController : Controller
    {
        //
        // GET: /Report/WarrantySales/

        public WarrantySalesController(Blue.Config.Settings settings)
        {
            this.Settings = settings;
        }

        private readonly Blue.Config.Settings Settings;

        public ActionResult Index()
        {
            return View();
        }

        //
        // GET: /Report/WarrantySales/Details/5

        public ActionResult Details(int id)
        {
            return View();
        }

        //
        // GET: /Report/WarrantySales/Create

        public ActionResult Create()
        {
            return View();
        } 

        //
        // POST: /Report/WarrantySales/Create

        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            try
            {
                // TODO: Add insert logic here

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
        
        //
        // GET: /Report/WarrantySales/Edit/5
 
        public ActionResult Edit(int id)
        {
            return View();
        }

        //
        // POST: /Report/WarrantySales/Edit/5

        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add update logic here
 
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        //
        // GET: /Report/WarrantySales/Delete/5
 
        public ActionResult Delete(int id)
        {
            return View();
        }

        //
        // POST: /Report/WarrantySales/Delete/5

        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            try
            {
                // TODO: Add delete logic here
 
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
    }
}
