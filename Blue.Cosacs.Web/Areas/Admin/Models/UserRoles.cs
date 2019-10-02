using System.Collections.Generic;

namespace Blue.Cosacs.Web.Areas.Admin.Models
{
    public class UserRoles : Role
    {
        public IEnumerable<Users> Users { get; set; }
    }

    public class Users
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}