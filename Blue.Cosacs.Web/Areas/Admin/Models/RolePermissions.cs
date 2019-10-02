using System.Collections.Generic;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
	public class RolePermissions : Role
	{
		public IEnumerable<Permissions> Permissions { get; set; }
	}

	public class Permissions
	{
		public int CategoryId{get;set;}
		public int PermissionId { get; set; }
		public string Name { get; set; }
		public string CategoryName { get; set; }
		public string Description { get; set; }
		public bool Active { get; set; }
		public bool Deny { get; set; }
	}
}