using System;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public sealed class RolePermissionsByCategory
    {
        public int CategoryId { get; set; }
        public int RoleId { get; set; }
        public bool Check { get; set; }
        public bool Allow { get; set; }
    }
}