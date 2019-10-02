using Blue.Admin;
using Blue.Glaucous.Client;
using Blue.Service;
using System;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class AuthorisationController : Controller
    {
        private IUserValidation userValidation;

        public AuthorisationController(IUserValidation userValidation)
        {
            this.userValidation = userValidation;
        }

        [Public]
        [HttpPost]
        public ActionResult Index(string username, string password, string requiredPermission, string permissionArea)
        {
            var result = this.userValidation.Validate(username, password);
            var hasPermission = false;

            if (!result.IsValid || result.User == null) return Json(new {HasPermission = false});

            Enum permission = null;

            try
            {
                switch (permissionArea)
                {
                    case "Service":
                        permission = (Enum)Enum.Parse(typeof(ServicePermissionEnum), requiredPermission);
                        break;
                }
            }
            catch (ArgumentException)
            {
                hasPermission = false;
            }

            hasPermission = permission != null && result.User.HasPermission(permission);
            
            return Json(new
            {
                HasPermission = hasPermission,
                User = new
                {
                    Id = result.User.Id,
                    Login = result.User.Login,
                    Name = result.User.FullName
                }
            });
        }
    }
}
