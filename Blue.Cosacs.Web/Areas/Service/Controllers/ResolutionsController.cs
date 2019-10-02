using System.Linq;
using System.Web.Mvc;
using Domain = Blue.Cosacs.Service;
using Blue.Service;
using System.Data.Entity;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class ResolutionsController : FormInlineBaseController<Domain.Context, Domain.Resolution, Models.Resolution, ResolutionsController.Search>
    {
        private IEventStore audit;
        public ResolutionsController(IEventStore audit)
        {
            this.audit = audit;
        }

        [Permission(ServicePermissionEnum.EditResolution)]
        public override ActionResult Index(int? page, Search s)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            return View(ToModels(Load(s)));
        }

        public class Search
        {
            public int? Id { get; set; }

            public string Description { get; set; }
        }

        protected override Transactions.WriteScope<Domain.Context> Write()
        {
            return Domain.Context.Write();
        }

        protected override Transactions.ReadScope<Domain.Context> Read()
        {
            return Domain.Context.Read();
        }

        protected override Models.Resolution ToModel(Domain.Resolution d)
        {
            return new Models.Resolution(d);
        }

        protected override DbSet<Domain.Resolution> Query(Domain.Context ctx)
        {
            return ctx.Resolution;
        }

        protected override IQueryable<Domain.Resolution> Filter(IQueryable<Domain.Resolution> query, Search search)
        {
            if (search == null)
                return query;

            if (search.Id != null)
                query = query.Where(q => q.id == search.Id.Value);

            if (!string.IsNullOrEmpty(search.Description))
                query = query.Where(q => q.Description.Contains(search.Description));

            return query;
        }

        protected override void OnUpdating(Domain.Context ctx, Models.Resolution m, Domain.Resolution d)
        {
            audit.LogAsync(new
            {
                old = d,
                @new = m
            }, Domain.EventType.ResolutionUpdate, Domain.EventCategory.Service);
            Fill(m, d);

        }

        protected override void OnCreating(Domain.Context ctx, Models.Resolution m, Domain.Resolution d)
        {
            Fill(m, d);
        }

        protected override void OnCreated(Domain.Context ctx, Models.Resolution m, Domain.Resolution d)
        {
            m.Id = d.id;
            audit.LogAsync(new
            {
                @new = m
            }, Domain.EventType.ResolutionCreate, Domain.EventCategory.Service);
        }

        private void Fill(Models.Resolution m, Domain.Resolution d)
        {
            d.Description = m.Description;
            d.Fail = m.Fail;
        }

        protected override void OnDeleting(Domain.Resolution d, Domain.Context ctx)
        {
            //var any = ctx.Load.Where(r => r.DriverId == d.Id).Any()
            //       || ctx.Truck.Where(r => r.DriverId == d.Id).Any();

            audit.LogAsync(new
            {
                driver = d
            }, Domain.EventType.ResolutionDelete, Domain.EventCategory.Service);

            //if (any)
            //    throw new ApplicationException("Cannot delete this driver because it's linked to existing Trucks and/or Delivery Schedules.");
        }
    }
}
