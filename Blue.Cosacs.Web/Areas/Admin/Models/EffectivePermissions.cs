
namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class EffectivePermissions
    {
        public int PermissionId { get; set; }
        public string Name { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }
        public bool? Deny { get; set; }
    }
}