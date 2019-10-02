
namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class RolePermissionRequest
    {
        public int Role { get; set; }
        public int Permission { get; set; }
        public bool Allow { get; set; }
        public bool Deny { get; set; }
    }
}