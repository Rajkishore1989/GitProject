using System.Data.Entity;
using System.Linq;
using Blue.Events;
using Domain = Blue.Cosacs.Service;
using Blue.Cosacs.Service;
using System.Web.Mvc;
using Blue.Service;
using Blue.Glaucous.Client.Mvc;


namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class ServiceSuppliersController : FormInlineBaseController<Domain.Context, Domain.ServiceSupplier, Models.ServiceSupplier, ServiceSuppliersController.Search>
    {
        private IEventStore audit;
        public ServiceSuppliersController(IEventStore audit)
        {
            this.audit = audit;
        }

        public class Search
        {
            public int? Id { get; set; }
            public string Supplier { get; set; }
        }

        [Permission(ServicePermissionEnum.ServiceSupplierView)]
        public override ActionResult Index(int? page, Search s)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            return View(ToModels(Load(s)));
        }

        protected override Transactions.WriteScope<Domain.Context> Write()
        {
            return Domain.Context.Write();
        }

        protected override Transactions.ReadScope<Domain.Context> Read()
        {
            return Domain.Context.Read();
        }

        protected override Models.ServiceSupplier ToModel(Domain.ServiceSupplier d)
        {
            return new Models.ServiceSupplier(d);
        }

        protected override DbSet<Domain.ServiceSupplier> Query(Domain.Context ctx)
        {
            return ctx.ServiceSupplier;
        }

        protected override IQueryable<Domain.ServiceSupplier> Filter(IQueryable<Domain.ServiceSupplier> query, Search search)
        {
            if (search == null)
                return query;

            if (search.Id != null)
                query = query.Where(q => q.Id == search.Id.Value);

            if (!string.IsNullOrEmpty(search.Supplier))
                query = query.Where(q => q.Supplier.Contains(search.Supplier));

            return query;
        }

        [Permission(ServicePermissionEnum.ServiceSupplierEdit)]
        protected override void OnUpdating(Domain.Context ctx, Models.ServiceSupplier m, Domain.ServiceSupplier d)
        {
            audit.LogAsync(new { old = d, @new = m }, EventType.ServiceSupplierEdit, EventCategory.Service);
            Fill(m, d);

        }

        [Permission(ServicePermissionEnum.ServiceSupplierEdit)]
        protected override void OnCreating(Domain.Context ctx, Models.ServiceSupplier m, Domain.ServiceSupplier d)
        {
            Fill(m, d);
        }

        [Permission(ServicePermissionEnum.ServiceSupplierEdit)]
        protected override void OnCreated(Domain.Context ctx, Models.ServiceSupplier m, Domain.ServiceSupplier d)
        {
            m.Id = d.Id;
            audit.LogAsync(new { @new = m }, EventType.ServiceSupplierCreate, EventCategory.Service);
        }

        [Permission(ServicePermissionEnum.ServiceSupplierEdit)]
        private void Fill(Models.ServiceSupplier m, Domain.ServiceSupplier d)
        {
            d.Supplier = m.Supplier;
        }

        [Permission(ServicePermissionEnum.ServiceSupplierEdit)]
        protected override void OnDeleting(Domain.ServiceSupplier d, Domain.Context ctx)
        {
            d.Id = d.Id;
            audit.LogAsync(new { @delete = d }, EventType.ServiceSupplierDelete, EventCategory.Service);
        }
    }
}
