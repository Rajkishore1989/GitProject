using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse.Common;
using System.Data.Entity.Infrastructure;
using Blue.Glaucous.Client.Mvc;


namespace Blue.Cosacs.Web
{
    public abstract class FormInlineBaseController<Context, Domain, Model, Search> : Controller
        where Context : Transactions.DbContextBase, new()
        where Domain : class, new()
        where Search : class, new()
        where Model : class, new()
    {
        [HttpGet]
        [Permission(WarehousePermissionEnum.DriverMaintenanceView)]
        public virtual ActionResult Index(int? page, Search s)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            return View(ToModels(Load(s)));
        }

        protected IEnumerable<Model> ToModels(IEnumerable<Domain> ds)
        {
            return ds.Select(d => ToModel(d));
        }

        [HttpGet]
        public virtual PartialViewResult RecordEdit(int id)
        {
            return RecordEdit(Load(id));
        }

        private PartialViewResult RecordEdit(Model m)
        {
            return PartialView("RecordEdit", m);
        }

        private PartialViewResult RecordEdit(Domain d)
        {
            return RecordEdit(ToModel(d));
        }

        protected abstract Transactions.WriteScope<Context> Write();
        protected abstract Transactions.ReadScope<Context> Read();

        protected abstract Model ToModel(Domain d);
        protected abstract DbSet<Domain> Query(Context ctx);

        [HttpPost]
        public virtual ActionResult Create(Model m)
        {
            if (ModelState.IsValid)
            {
                using (var scope = Write())
                {
                    try
                    {
                        var d = new Domain();
                        OnCreating(scope.Context, m, d);
                        Query(scope.Context).Add(d);
                        scope.Context.SaveChanges();
                        OnCreated(scope.Context, m, d);
                        scope.Complete();
                    }
                    catch (DbUpdateException ex)
                    {
                        if (ex.InnerException.InnerException.ToString().Contains("Cannot insert duplicate key in object 'Admin.Role'"))
                        {
                            Response.StatusCode = 400;
                            Response.StatusDescription = "Duplicate role. Please rename and try again.";
                            return RecordEdit(m);
                        }
                    }
                }
                Response.StatusCode = 201;
                return PartialView("RecordView", m);
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(m);
            }
        }

        [HttpPut]
        public virtual ActionResult Update(int id, Model m)
        {
            if (ModelState.IsValid)
            {
                using (var scope = Write())
                {
                    var record = Query(scope.Context).Find(id);
                    OnUpdating(scope.Context, m, record);
                    scope.Context.SaveChanges();
                    scope.Complete();
                }
                return PartialView("RecordView", m);
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(m);
            }
        }

        protected virtual void OnCreating(Context ctx, Model m, Domain d)
        {

        }

        protected virtual void OnCreated(Context ctx, Model m, Domain d)
        {

        }

        protected virtual void OnUpdating(Context ctx, Model m, Domain d)
        {
            // record.Name = m.Name;
            // record.PhoneNumber = m.PhoneNumber;
        }

        [HttpDelete]
        public virtual void Delete(int id)
        {
            try
            {
                using (var scope = Write())
                {
                    var record = Query(scope.Context).Find(id);
                    if (record != null)
                    {
                        OnDeleting(record, scope.Context);
                        Query(scope.Context).Remove(record);
                        scope.Context.SaveChanges();
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

        protected virtual void OnDeleting(Domain d, Context ctx)
        {
            //var any = scope.Context.Load.Where(r => r.DriverId == id).Any()
            //       || scope.Context.Truck.Where(r => r.DriverId == id).Any();

            //if (any)
            //    throw new ApplicationException("Cannot delete this driver because it's linked to existing Trucks and/or Delivery Schedules.");
        }

        protected virtual IEnumerable<Domain> Load(Search s)
        {
            using (var scope = Read())
                return Filter(Query(scope.Context), s).ToList();
        }

        protected virtual IQueryable<Domain> Filter(IQueryable<Domain> query, Search search)
        {
            if (search == null)
                return query;

            return query;
        }

        protected virtual Domain Load(int id)
        {
            using (var scope = Read())
                return Query(scope.Context).Find(id);
        }

        protected virtual Model DefaultNew()
        {
            return new Model();
        }
    }
}
