using System.Collections.Generic;
using Blue.Admin;
using Blue.Config;
using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Report;
using Blue.Cosacs.Sales;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warranty;
using Blue.Cosacs.Web.Helpers;
using Blue.Service;

namespace Blue.Cosacs.Web.Common
{
    using System;
    using System.Linq;

    public static class Permissions
    {
        private static List<EnumHelper.NameValue> GetPermissions()
        {
            var nameValues = new List<EnumHelper.NameValue>();
            nameValues.AddRange(GetNames(typeof(AdminPermissionEnum), "Admin"));
            nameValues.AddRange(GetNames(typeof(ConfigPermissionEnum), "Config"));
            nameValues.AddRange(GetNames(typeof(MerchandisingPermissionEnum), "Merchandising"));
            nameValues.AddRange(GetNames(typeof(ReportPermissionEnum), "Report"));
            nameValues.AddRange(GetNames(typeof(SalesPermissionEnum), "Sales"));
            nameValues.AddRange(GetNames(typeof(ServicePermissionEnum), "Service"));
            nameValues.AddRange(GetNames(typeof(WarehousePermissionEnum), "Warehouse"));
            nameValues.AddRange(GetNames(typeof(WarrantyPermissionEnum), "Warranty"));
            return nameValues;
        }

        private static IEnumerable<EnumHelper.NameValue> GetNames(Type enumType, string qualifier)
        {
            return
                EnumHelper.GetValuesFromEnum(enumType)
                    .Select(v => new EnumHelper.NameValue { Name = qualifier + "." + v.Name, Value = v.Value });
        }

        public static List<EnumHelper.NameValue> List = GetPermissions();
    }
}
