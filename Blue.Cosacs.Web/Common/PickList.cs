using System.Collections.Generic;
using System.Linq;

namespace Blue.Cosacs.Web.Common
{
    /// <summary>
    /// Thread safe so it can be used as singleton.
    /// </summary>
    public class CachedPickListProvider : IPickListProvider
    {
        public CachedPickListProvider(IPickListProvider provider)
        {
            this.provider = provider;
        }

        private readonly IPickListProvider provider;
        private IList<IPickListRow> rows;

        public string Id
        {
            get { return provider.Id; }
        }

        public IEnumerable<IPickListRow> Load()
        {
            lock (this)
            {
                if (rows == null)
                    rows = provider.Load().ToList(); // force load becaue it can be lazy
            }
            return rows;
        }

        public string Name
        {
            get { return provider.Name; }
        }
    }

    public class CodePickListProvider : LinqPickListProvider
    {
        public CodePickListProvider(string id, string name) : base(id, name, () => Load(id)) { }

        private static IEnumerable<IPickListRow> Load(string id)
        {
            using (var scope = External.Context.Read())
            {
                var rows = (from c in scope.Context.Code
                            where c.category == id && c.statusflag == "L"
                            select new { k = c.code, v = c.codedescript, s = c.sortorder }).Distinct().ToArray();
                return (from r in rows orderby r.s select new PickListRow(r.k, r.v)).ToArray();
            }
        }

        public static IEnumerable<IPickListProvider> All()
        {
            using (var scope = External.Context.Read())
            {
                var cats = (from cat in scope.Context.CodeCat
                            select new { id = cat.category, name = cat.catdescript }).ToList();

                return from cat in cats
                       select new CodePickListProvider(cat.id, cat.name);
            }
        }
    }

    //public class ConfigPickListProvider : LinqPickListProvider
    //{
    //    public ConfigPickListProvider(string listId, string name) : base(listId, name, () => Load(listId)) { }

    //    private static IEnumerable<IPickListRow> Load(string listId)
    //    {
    //        return new Config.Repositories.PickListRepository().Load(listId);
    //    }

    //    public static IEnumerable<IPickListProvider> All()
    //    {
    //        using (var scope = External.Context.Read())
    //        {
    //            return from cat in new Config.Repositories.PickListRepository().LoadCategories()
    //                   select new ConfigPickListProvider(cat.k, cat.v);
    //        }
    //    }
    //}

    public class SetsPickListProvider : LinqPickListProvider
    {
        public SetsPickListProvider(string id) : base(id, id, () => Load(id)) { }

        private static IEnumerable<IPickListRow> Load(string id)
        {
            using (var scope = External.Context.Read())
            {
                return (from s in scope.Context.ViewSets
                        where s.tname == id
                        orderby s.setdescript
                        select new PickListRow { k = s.setname, v = s.setdescript }).ToArray();
            }
        }

        public static IEnumerable<IPickListProvider> All()
        {
            using (var scope = External.Context.Read())
            {
                var sets = (from s in scope.Context.ViewSets select s.tname).Distinct().ToList();
                return from s in sets select new SetsPickListProvider(s);
            }
        }
    }

    public class BranchPickListProvider : LinqPickListProvider
    {
        public BranchPickListProvider()
            : base("BRANCH", "All Physical Branches", () =>
            {
                using (var scope = External.Context.Read())
                    return (from b in scope.Context.Branch
                            select new { b.branchno, b.branchname }).ToList()
                            .Select(b => new PickListRow(b.branchno.ToString(), b.branchno.ToString() + ' ' + b.branchname)).ToArray();
            })
        { }
    }

    public class BankPickListProvider : LinqPickListProvider
    {
        public BankPickListProvider()
            : base("Bank", "Bank Names", () =>
            {
                using (var scope = External.Context.Read())
                    return (from b in scope.Context.Bank
                            select new { b.bankcode, b.bankname }).ToList()
                            .Select(b => new PickListRow(b.bankcode, b.bankname)).ToArray();
            })
        { }
    }

    public class ProductCategoriesPickListProvider : LinqPickListProvider
    {
        public ProductCategoriesPickListProvider()
            : base("PRODCATS", "Product Categories", () =>
            {
                var categories = new string[] { "PCE", "PCF", "PCO", "PCW" };

                using (var scope = External.Context.Read())
                {
                    var rows = (from c in scope.Context.Code
                                where c.statusflag == "L" && categories.Contains(c.category)
                                orderby c.category, c.sortorder
                                select new { k = c.code, v = c.codedescript }).ToArray();

                    return (from r in rows.Distinct()
                            select new PickListRow(r.k, r.v)).ToArray();
                }
            })
        { }
    }

    public class EmpeenoPickListProvider : LinqPickListProvider
    {
        public EmpeenoPickListProvider()
            : base("EMPEENO", "All Employees (now all users)", () =>
            {
                using (var scope = Admin.Context.Read())
                    return (from u in scope.Context.User
                            select new { u.Id, u.FullName }).ToList()
                .Select(u => new PickListRow(u.Id.ToString(), u.FullName)).ToArray();
            })
        { }
    }

    public class SettingsListProvider : LinqPickListProvider
    {
        public SettingsListProvider(string settingId, string settingName, Blue.Config.ISettings settingsProvider)
            : base(settingsProvider.Module.Namespace + "." + settingId, settingName, () => Load(settingId, settingsProvider)) { }

        private static IEnumerable<IPickListRow> Load(string settingId, Blue.Config.ISettings settingsProvider)
        {
            var setting = (from s in settingsProvider.Metadata()
                           where s.Type == Config.SettingMetadata.SettingsTypeEnum.list && s.Id == settingId
                           select s).Single();

            var reader = (Config.ISettingsReader)settingsProvider;
            var lSettings = reader.ListAll(settingId);

            return from v in lSettings
                   where !string.IsNullOrWhiteSpace(v)
                   select new PickListRow() { k = v.Trim(), v = v.Trim() };
        }

        public static IEnumerable<IPickListProvider> All(Blue.Config.ISettings settingsProvider)
        {
            var settingIdsAndNames = (from setting in settingsProvider.Metadata()
                                      where setting.Type == Config.SettingMetadata.SettingsTypeEnum.list
                                      select new { setting.Id, setting.Name });

            settingIdsAndNames = settingIdsAndNames.Distinct();

            var allProviders = (from settingInfo in settingIdsAndNames
                                select new SettingsListProvider(settingInfo.Id, settingInfo.Name, settingsProvider));

            return allProviders;
        }
    }

    public class ServiceSupplier : LinqPickListProvider
    {
        public ServiceSupplier()
            : base("ServiceSupplier", "ServiceSuppliers", () =>
            {
                using (var scope = External.Context.Read())
                {

                    var suppliers = scope.Context.ServiceSupplierView
                        .Select(p => p.Supplier)
                        .Distinct()
                        .ToList();
                    suppliers.Add("Other");

                    return suppliers.Select(p => new PickListRow(p, p)).OrderBy(p => p.k)
                        .ToArray();
                }
            })
        { }
    }

    public class ServiceResolutionListProvider : LinqPickListProvider
    {
        public ServiceResolutionListProvider()
            : base("RESOLUTION", "All Service's Resolutions", () =>
            {
                using (var scope = Service.Context.Read())
                {
                    return (from r in scope.Context.Resolution
                            select new { code = r.Description, r.Description }).ToList()
                        .Select(r => new PickListRow(r.Description, r.Description)).ToArray();
                }
            })
        { }
    }

    public class SalePersonListProvider : LinqPickListProvider
    {
        public SalePersonListProvider()
            : base("SalePersons", "All Warranty's Sale Persons", () =>
            {
                using (var scope = Warranty.Context.Read())
                {
                    return (from r in scope.Context.SalePersonView
                            orderby r.Name
                            select new { code = r.Id, Description = r.Name }).ToList()
                            .Select(r => new PickListRow(r.code.ToString(), r.Description)).ToArray();

                }
            })
        { }
    }

}