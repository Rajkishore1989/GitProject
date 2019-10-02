using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Domain = Blue.Cosacs.Warehouse;
using System.Data.Linq.SqlClient;
using Blue.Cosacs.Warehouse.Common;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class TrucksController : Controller
    {

        private readonly IEventStore audit;
        public TrucksController(IEventStore audit)
        {
            this.audit = audit;
        }

        [HttpGet]
        [Permission(WarehousePermissionEnum.TruckMaintenanceView)]
        public virtual ActionResult Index(int? page, Search s)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            return View(Load(s));
        }

        [HttpGet]
        public PartialViewResult RecordEdit(int id)
        {
            return RecordEdit(Load(id));
        }

        private PartialViewResult RecordEdit(TruckView t)
        {
            return PartialView(new Models.Truck(t));
        }

        [HttpPost]
        public ActionResult Create(TruckView r)
        {
            if (ModelState.IsValid)
            {
                TruckView truckView; //#10814

                using (var scope = Domain.Context.Write())
                {
                    Truck t = new Truck
                    {
                        Name = r.Name,
                        Branch = r.Branch,
                        Size = r.Size,
                        DriverId = r.DriverId
                    };

                    //scope.Context.Truck.Add(r);
                    scope.Context.Truck.Add(t);
                    scope.Context.SaveChanges();

                    truckView = scope.Context.TruckView.Find(t.Id); //#10814

                    scope.Complete();
                }
                Response.StatusCode = 201;
                audit.LogAsync(new { Id = truckView.Id, Name = truckView.Name, Size = truckView.Size, Branch = truckView.Branch, DriverId = truckView.DriverId }, EventType.TruckCreate, EventCategory.Warehouse);
                return PartialView("RecordView", truckView); //#10814
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(r);
            }
        }

        [HttpPut]
        public ActionResult Update(int id, TruckView r)
        {
            if (ModelState.IsValid)
            {
                TruckView truckView;
                using (var scope = Domain.Context.Write())
                {
                    var record = scope.Context.Truck.Find(id);
                    record.Name = r.Name;
                    record.Branch = r.Branch;
                    record.Size = r.Size;
                    record.DriverId = r.DriverId;
                    scope.Context.SaveChanges();

                    truckView = scope.Context.TruckView.Find(id); //#10778
                    scope.Complete();
                }
                audit.LogAsync(new { truck = r }, EventType.TruckUpdate, EventCategory.Warehouse);
                return PartialView("RecordView", truckView);
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(r);
            }
        }

        [HttpDelete]
        public void Delete(int id)
        {
            try
            {
                using (var scope = Domain.Context.Write())
                {
                    var truck = scope.Context.Truck.Find(id);
                    if (truck != null)
                    {
                        if (scope.Context.Booking.Where(r => r.TruckId == id).Any())
                            throw new ApplicationException("Cannot delete this truck because it's linked to existing Bookings.");
                        scope.Context.Truck.Remove(truck);
                        scope.Context.SaveChanges();
                        audit.LogAsync(new { truck = truck }, EventType.TruckDelete, EventCategory.Warehouse);
                    }
                    scope.Complete();
                }
            }
            catch (ApplicationException e)
            {
                Response.StatusCode = 400;
                Response.StatusDescription = e.Message;
                Response.End();
            }
        }

        public class Search
        {
            public string Name { get; set; }
            public short? Branch { get; set; }
            public int? DriverId { get; set; } //#10780
            public string Size { get; set; }
        }

        private IEnumerable<TruckView> Load(Search s)
        {
            using (var scope = Domain.Context.Read())
                return Filter(scope.Context.TruckView, s).ToList();
        }

        private IQueryable<TruckView> Filter(IQueryable<TruckView> query, Search search)
        {
            using (var scope = Domain.Context.Read())
            {
                //if (!String.IsNullOrWhiteSpace(search.Driver))
                if(search.DriverId != null && search.DriverId !=0) //#10780
                {
                    //var driver = scope.Context.Driver.Where(d => d.Name.Contains(search.Driver));
                    var driver = scope.Context.Driver.Where(d => d.Id == search.DriverId); //#10780
                    query = query.Join(driver, q => q.DriverId, d => d.Id, (qu, dr) => qu);
                }

                if (search == null)
                    return query;

                if (!string.IsNullOrEmpty(search.Name))
                    query = query.Where(q => q.Name.Contains(search.Name));

                if (search.Branch.HasValue)
                    query = query.Where(q => q.Branch == search.Branch.Value);

                if (!string.IsNullOrEmpty(search.Size))
                    query = query.Where(q => q.Size == search.Size);

                return query;
            }
        }

        public class DriverSearch
        {
            public string q { get; set; }
            public int page_limit {get;set;}
            public int page {get;set;}
        }

        public class DriverResults
        {
            public List<Driver> drivers { get; set; }
            public int total { get; set; }
        }


        public JsonResult GetDrivers(DriverSearch s)
        {
            using (var scope = Domain.Context.Read())
            {
                return Json(new DriverResults
                {
                    drivers = scope.Context.Driver.Where(d => d.Name.Contains(s.q)).OrderBy(d => d.Name).Skip(s.page_limit * (s.page - 1)).Take(s.page_limit).ToList(),
                    total = scope.Context.Driver.Where(d => d.Name.Contains(s.q)).Count()
                },JsonRequestBehavior.AllowGet);
            }
        }

        private TruckView Load(int id)
        {
            using (var scope = Domain.Context.Read())
                return scope.Context.TruckView.Find(id);
        }

        private Models.Truck DefaultNew()
        {
            return new Models.Truck();
        }

        
    }
}
