using StructureMap;

namespace Blue.Cosacs.Web.Common
{
    public static class Bootstrapper
    {
        public static void Initialize()
        {
            ObjectFactory.Initialize(x =>
            {
                x.AddRegistry(new GlobalRegistry());
                x.AddRegistry(new Blue.Admin.Registry());
                x.AddRegistry(new Warehouse.Registry());
                x.AddRegistry(new Service.Registry());
                x.AddRegistry(new Report.Registry());
                x.AddRegistry(new Warranty.Registry());
                x.AddRegistry(new Financial.Registry());
                x.AddRegistry(new Cosacs.Merchandising.Registry());
            });
        }
    }
}