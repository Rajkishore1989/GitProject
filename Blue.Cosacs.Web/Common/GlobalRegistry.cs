using System.Web;
using Artemis.Runtime.Security;
using Blue.Collections.Generic;
using Blue.Cosacs.Service.Repositories;
using Blue.Cosacs.Web.Areas.Admin.Controllers;

namespace Blue.Cosacs.Web.Common
{
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Web.Common.Merchandising;

    public class GlobalRegistry : StructureMap.Configuration.DSL.Registry // Artemis.Runtime.Registry
    {
        private const string ConnectionStringName = "Default";

        public GlobalRegistry()
        {
            For<IUserContextProvider>().Add<ThreadUserContextProvider>();
            For<Artemis.Runtime.Services.IExceptionSink>().Add<Artemis.Runtime.Services.ElmahExceptionSink>();
            For<Artemis.Runtime.Storage.IStorageProvider>().Singleton().Add<Artemis.Runtime.Storage.SqlStorageProvider>();

            For<IClock>().Singleton().Add<DateTimeClock>();
            For<IPermissionStore>().Singleton().Use<PermissionStoreNull>();
            For<Hub.Server.IHub>().Use(ctx => new Hub.Server.SqlHub(ConnectionStringName));
            For<Events.IEventStore>().Singleton().Use(ctx => new EventStore(ConnectionStringName));
            For<Events.IEventQuery>().Use(ctx => new Events.EventQuery(ConnectionStringName));
            For<Blue.Admin.Email.IMailUser>().Use<Blue.Admin.Email.MailUser>();
            For<Blue.Admin.Email.IMail>().Use<Blue.Admin.Email.MailNotification>();
            For<Blue.Admin.IAutoLockoutManager>().Use<Blue.Admin.AutoLockoutManager>();
            For<IMerchandisingConfiguration>().Use<MerchandisingConfiguration>();
            For<ICacheProvider>().Use<CacheProvider>();

            For<TechnicianRepository>().Singleton().Use((ctx) => new TechnicianRepository(ctx.GetInstance<Blue.Events.IEventStore>(), ctx.GetInstance<IClock>()));

            For<Hub.Client.IPublisher>().Singleton().Use(
                (ctx) => new Hub.Client.SqlPublisher(ConnectionStringName, ctx.GetInstance<IClock>()));

            var adminSettings = new Blue.Admin.Settings();
            var configSettings = new Blue.Config.Settings();
            var reportSettings = new Blue.Cosacs.Report.Settings();
            var serviceSettings = new Blue.Cosacs.Service.Settings();
            var warehouseSettings = new Blue.Cosacs.Warehouse.Settings();
            var merchandisingSettings = new Cosacs.Merchandising.Settings();
            //var warrantySettings = new Blue.Cosacs.Warranty.Settings();
            // New Pick Lists registration -- settings for the various modules
            SettingsListProvider.All(adminSettings).ForEach(Add);
            SettingsListProvider.All(configSettings).ForEach(Add);
            SettingsListProvider.All(reportSettings).ForEach(Add);
            SettingsListProvider.All(serviceSettings).ForEach(Add);
            SettingsListProvider.All(warehouseSettings).ForEach(Add);
            SettingsListProvider.All(merchandisingSettings).ForEach(Add);
           // foreach (var provider in SettingsListProvider.All(warrantySettings))
                //Add(provider);
            Add(new ServiceSupplier());
            
            // Pick Lists registration
            foreach (var provider in CodePickListProvider.All())
                Add(provider);
            //foreach (var provider in ConfigPickListProvider.All())
            //    Add(provider);
            foreach (var provider in SetsPickListProvider.All())
                Add(provider);
            Add(new BranchPickListProvider());
            Add(new BankPickListProvider());
            Add(new ProductCategoriesPickListProvider());
            Add(new EmpeenoPickListProvider());
            Add(new ServiceResolutionListProvider());
            Add(new SalePersonListProvider());
            Add(new Cosacs.Financial.TransactionTypeListProvider());
            Add(new UsersPickList());
            //Add(new WarehousePickRejectReasonsPickListProvider());
            //Add(new WarehouseLoadRejectReasonsPickListProvider());
            //Add(new WarehouseDelRejectReasonsPickListProvider());
            //Add(new EmployeeListProvider());

            // Settings for various modules
            Blue.Admin.Settings.Register<Blue.Admin.Settings>(this, adminSettings);
            Blue.Config.Settings.Register<Blue.Config.Settings>(this, configSettings);
            Blue.Cosacs.Report.Settings.Register<Blue.Cosacs.Report.Settings>(this, reportSettings);
            Blue.Cosacs.Service.Settings.Register<Blue.Cosacs.Service.Settings>(this, serviceSettings);
            Blue.Cosacs.Warehouse.Settings.Register<Blue.Cosacs.Warehouse.Settings>(this, warehouseSettings);
            Cosacs.Merchandising.Settings.Register(this, merchandisingSettings);
            //Blue.Cosacs.Warranty.Settings.Register<Blue.Cosacs.Warranty.Settings>(this, warrantySettings);

            For<Blue.Admin.ISessionManager>().Singleton().Use<Blue.Glaucous.Client.RedisSessionManager>();
            For<Blue.Config.ISettingsReader>().Singleton().Use(merchandisingSettings);
        }

        private void Add(IPickListProvider provider)
        {
            For<IPickListProvider>().Singleton().Add(provider).Named(provider.Id);
        }

        private class EventStore : Blue.Events.EventStoreBase
        {
            public EventStore(string connectionStringName) : base(connectionStringName) { }

            protected override string EventBy
            {
                get
                {
                    if (HttpContext.Current.User != null && HttpContext.Current.User.Identity != null)
                        return HttpContext.Current.User.Identity.Name;
                    return null;
                }
            }
        }
    }
}