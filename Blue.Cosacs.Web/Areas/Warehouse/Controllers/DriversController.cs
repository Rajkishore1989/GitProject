using System;
using System.Data.Entity;
using System.Linq;
using Domain = Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warehouse;
using Blue.Events;
using System.Web.Mvc;
using Blue.Cosacs.Web.Common;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class DriversController : FormInlineBaseController<Domain.Context, Domain.Driver, Models.Driver, DriversController.Search>
    {
        private IEventStore audit;
        public DriversController(IEventStore audit)
        {
            this.audit = audit;
        }

        [Permission(WarehousePermissionEnum.DriverMaintenanceView)]
        public override ActionResult Index(int? page, Search s)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            return View(ToModels(Load(s)));
        }

        public class Search
        {
            public int? Id { get; set; }
            public string Name { get; set; }
        }

        protected override Transactions.WriteScope<Domain.Context> Write()
        {
            return Domain.Context.Write();
        }

        protected override Transactions.ReadScope<Domain.Context> Read()
        {
            return Domain.Context.Read();
        }

        protected override Models.Driver ToModel(Domain.Driver d)
        {
            return new Models.Driver(d);
        }

        protected override DbSet<Domain.Driver> Query(Domain.Context ctx)
        {
            return ctx.Driver;
        }

        protected override IQueryable<Domain.Driver> Filter(IQueryable<Domain.Driver> query, Search search)
        {
            if (search == null)
                return query;

            if (search.Id != null)
                query = query.Where(q => q.Id == search.Id.Value);

            if (!string.IsNullOrEmpty(search.Name))
                query = query.Where(q => q.Name.Contains(search.Name));

            return query;
        }

        protected override void OnUpdating(Domain.Context ctx, Models.Driver m, Domain.Driver d)
        {
            audit.LogAsync(new { old = d, @new = m }, EventType.DriverUpdate, EventCategory.Warehouse);
            Fill(m, d);
           
        }

        protected override void OnCreating(Domain.Context ctx, Models.Driver m, Domain.Driver d)
        {
            Fill(m, d);
        }

        protected override void OnCreated(Domain.Context ctx, Models.Driver m, Domain.Driver d)
        {
            m.Id = d.Id;
            audit.LogAsync(new { @new = m }, EventType.DriverCreate, EventCategory.Warehouse);
        }

        private void Fill(Models.Driver m, Domain.Driver d)
        {
            d.Name = m.Name;
            d.PhoneNumber = m.PhoneNumber;
        }

        //protected override void OnCreated(Domain.Context ctx, Models.Driver m, Domain.Driver d)
        //{
        //    m.Id = d.Id;
        //    audit.LogAsync(new { @new = m }, EventType.Warehouse, EventCategory.DriverCreate);
        //}

        protected override void OnDeleting(Domain.Driver d, Domain.Context ctx)
        {
            var any = ctx.Load.Where(r => r.DriverId == d.Id).Any()
                   || ctx.Truck.Where(r => r.DriverId == d.Id).Any();
            audit.LogAsync(new { driver = d }, EventType.DriverDelete, EventCategory.Warehouse);

            if (any)
                throw new ApplicationException("Cannot delete this driver because it's linked to existing Trucks and/or Delivery Schedules.");
        }
    }
}
