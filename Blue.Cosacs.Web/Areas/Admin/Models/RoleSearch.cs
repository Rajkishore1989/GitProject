using System.Collections.Generic;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{

    public class RoleSearch
    {
        public string q { get; set; }
        public int page_limit { get; set; }
        public int page { get; set; }
    }

    public class RoleResults
    {
        public List<Blue.Admin.Role> Roles { get; set; }
        public int total { get; set; }
    }
}