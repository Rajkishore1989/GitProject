using System.Collections.Generic;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class UserProfilePermissions
    {
        public int Id { get; set; }
        public string BranchName { get; set; }
        public IEnumerable<RoleSelect> Roles { get; set; }
        public List<EffectivePermissions> Permissions { get; set; }
        public List<RolePermissionsDisplay> RolePermission { get; set; }
        public IEnumerable<Events.IEvent> Audit { get; set; }
    }

    public class RoleSelect
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

}
