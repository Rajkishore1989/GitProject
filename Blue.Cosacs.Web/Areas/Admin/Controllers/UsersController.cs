using Blue.Admin;
using Blue.Admin.Event;
using Blue.Admin.Password;
using Blue.Admin.Solr;
using Blue.Cosacs.Web.Areas.Admin.Models;
using Blue.Cosacs.Web.Common;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using StructureMap;
using System;
using System.Collections;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using Domain = Blue.Admin;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class UsersController : Controller
    {
        public UsersController(IContainer container, IClock clock, UserRepository repository, IEventStore audit)
        {
            this.container = container;
            this.clock = clock;
            this.repository = repository;
            this.audit = audit;
        }

        private readonly IContainer container;
        private readonly IClock clock;
        private readonly UserRepository repository;
        private readonly IEventStore audit;

        [HttpGet]
        [Permission(Blue.Admin.AdminPermissionEnum.SearchUsers)]
        public ActionResult Index(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0, int rows = 10)
        {
            var result = SearchSolr(q, start, rows);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "User")
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: new[] { "HomeBranchName", "Roles", "Locked" },
                    showEmpty: false,
                   // the order that the fields appear on the search page are determined by the order of this array
                   start: start,
                   rows: rows
                   );
        }

        public JsonResult ForceIndex()
        {
            audit.LogAsync(new { }, EventType.AdminIndex, EventCategory.Index);
            return Json(SolrIndex.IndexUser(), JsonRequestBehavior.AllowGet);
        }

        public ActionResult Profile(int id)
        {
            var profile = new ProfileLoad
            {
                Profile = GetDetails(id)
            };
            profile.LockUserParameters = new Models.LockUser()
            {
                IsLocked = profile.Profile.Locked,
                UserId = profile.Profile.Id
            };

            ViewBag.Title = string.Format("{0} {1}", profile.Profile.FirstName, profile.Profile.LastName);
            ViewBag.CurrentUser = (this.GetUser().Login == profile.Profile.Login);
            ViewBag.Login = profile.Profile.Login;
            ViewBag.DeleteProfilePermission = this.GetUser().HasPermission(AdminPermissionEnum.DeleteProfile);

            // load Security Audit
            var auditQuery = container.GetInstance<Blue.Events.IEventQuery>();
            profile.Audit = auditQuery.Search(new Events.EventQuerySearch
            {
                EventBy = profile.Profile.Login,
                DateEnd = clock.Now.Date.AddDays(1),
                DateStart = clock.Now.Date.AddDays(-7), // last week
                Top = 50,
                Category = Blue.Admin.SessionManager.EventCategory
            });

            using (var scope = Context.Read())
            {
                var activeProfiles = (from a in scope.Context.AdditionalUserProfile
                                      where a.UserId == id
                                      select a.ProfileId).ToList();

                profile.AdditionalProfiles = (from p in scope.Context.AdditionalProfile
                                              select new ProfileLoad.UserProfile()
                                              {
                                                  id = p.Id,
                                                  ProfileName = p.Name,
                                                  Permission = p.Permission,
                                                  Module = p.Module
                                              }).ToList();

                profile.AdditionalProfiles.ForEach(p =>
                {
                    if (activeProfiles.Contains(p.id))
                        p.Active = true;
                    p.HasPermission = this.GetUser().HasPermission(p.Permission);
                });
            }
            return View("Profile", profile);
        }

        [HttpPost]
        public ActionResult Details(Profile profile)
        {
            if (repository.LoginExists(profile.Id, profile.Login))
                ModelState.AddModelError("Login", "The login supplied is already in use");

            if (profile.FactEmployee != null)
            {
                Regex r = new Regex(@"^\w+$", RegexOptions.IgnoreCase);
                Match m = r.Match(profile.FactEmployee);
                if (!m.Success)
                    ModelState.AddModelError("FactEmployee", "Fact Employee Id can't contain special characters.");
            }

            if (ModelState.IsValid && (!this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.EditUsers) || this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.ChangeBranch))) //#11460
            {
                Update(profile);
                return Details(profile.Id);
            }
            return PartialView("DetailsEditor", profile);
        }

        [HttpGet]
        public ActionResult Details(int id)
        {
            return PartialView("Details", GetDetails(id));
        }

        private Profile GetDetails(int id)
        {
            using (var scope = Domain.Context.Read())
            {
                // User info
                var user = (from u in scope.Context.User
                            join bv in scope.Context.BranchLookup on u.BranchNo equals bv.branchno into tb
                            from b in tb.DefaultIfEmpty()
                            where u.Id == id
                            select new Profile
                            {
                                Id = u.Id,
                                FirstName = u.FirstName,
                                LastName = u.LastName,
                                Login = u.Login,
                                ExternalLogin = u.ExternalLogin,
                                PasswordExpireDate = u.LastChangePassword,
                                eMail = u.eMail,
                                BranchNo = u.BranchNo,
                                BranchName = b.BranchNameLong,
                                Locked = u.Locked,
                                FactEmployee = u.FactEmployeeNo,         //#15273
                                AddressLine1 = u.AddressLine1,
                                AddressLine2 = u.AddressLine2,
                                AddressLine3 = u.AddressLine3,
                                PostCode = u.PostCode,
                                Phone = u.Phone,
                                PhoneAlternate = u.PhoneAlternate
                            }).FirstOrDefault();

                user.PasswordExpireDate = user.PasswordExpireDate.AddDays(PasswordComplexityParameters.Current.PasswordExpireInDays);

                return user;
            }
        }

        private void Update(Profile profile)
        {

            if (!(this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.EditUsers) || this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.ChangeBranch)))
            {
                if (!this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.EditUsers))
                {
                    throw new PermissionException(Blue.Helpers.Humanize(AdminPermissionEnum.EditUsers.ToString()));
                }
                throw new PermissionException(Blue.Helpers.Humanize(AdminPermissionEnum.ChangeBranch.ToString()));
            }

            int userId;
            using (var scope = Domain.Context.Write())
            {
                var user = scope.Context.User.Find(profile.Id);
                if (this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.ChangeBranch))
                {
                    var branch = scope.Context.BranchLookup.FirstOrDefault(b => b.branchno == profile.BranchNo);

                    user.BranchNo = profile.BranchNo;
                    user.BranchId = branch.BranchLocationId;
                }
                if (this.GetUser().HasPermission(Blue.Admin.AdminPermissionEnum.EditUsers))
                {
                    user.eMail = profile.eMail;
                    user.ExternalLogin = profile.ExternalLogin;
                    user.FirstName = profile.FirstName;
                    user.LastName = profile.LastName;
                    user.Login = profile.Login;
                    user.FactEmployeeNo = profile.FactEmployee;                 //#15273
                    user.AddressLine1 = profile.AddressLine1;
                    user.AddressLine2 = profile.AddressLine2;
                    user.AddressLine3 = profile.AddressLine3;
                    user.PostCode = profile.PostCode;
                    user.Phone = profile.Phone;
                    user.PhoneAlternate = profile.PhoneAlternate;
                }
                scope.Context.SaveChanges();
                userId = user.Id;
                scope.Complete();
            }
            SolrIndex.IndexUser(new[] { userId });
            audit.LogAsync(new { Profile = profile }, EventType.UpdateProfile, EventCategory.Admin);

        }

        [HttpGet]
        [Permission(Blue.Admin.AdminPermissionEnum.CreateUser)]
        public ActionResult Create()
        {
            return View(new ProfileNew());
        }

        public JsonResult LockUser(int user)
        {
            var successful = false;
            var haveBeenLocked = false;
            var errorMessage = string.Empty;

            try
            {
                haveBeenLocked = repository.ToggleUserLock(user, this.GetUser());

                if (haveBeenLocked)
                {
                    this.container.GetInstance<ISessionManager>().Kill(user);
                }

                successful = true;
                audit.LogAsync(new { UserLocked = user }, EventType.LockUser, EventCategory.Admin);
                SolrIndex.IndexUser(new int[] { user });
            }
            catch (PermissionException exp)
            {
                errorMessage = exp.Message;
                successful = false;
            }
            catch (System.Exception)
            {
                errorMessage = "Could not find the user to lock/unlock";
                successful = false;
            }

            return Json(new
            {
                Successful = successful,
                HaveBeenLocked = haveBeenLocked,
                Message = errorMessage
            });
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.CreateUser)]
        public ActionResult CheckLogin(string Login)
        {
            return Json(repository.LoginExists(Login), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.CreateUser)]
        public ActionResult CheckLoginUpdate(string Login, int current)
        {
            return Json(repository.LoginExists(current, Login), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.CreateUser)]
        public ActionResult Create(ProfileNew profile)
        {
            if (repository.LoginExists(profile.Login))
            {
                ModelState.AddModelError("Login", "The user name supplied is already in use");
            }
            if (profile.FactEmployee != null)
            {
                Regex r = new Regex(@"^\w+$", RegexOptions.IgnoreCase);
                Match m = r.Match(profile.FactEmployee);
                if (!m.Success)
                    ModelState.AddModelError("FactEmployee", "Fact Employee Id can't contain special characters.");
            }

            if (ModelState.IsValid)
            {
                int userId;
                var user = new Blue.Admin.User
                {
                    BranchNo = profile.BranchNo,
                    eMail = profile.eMail,
                    ExternalLogin = profile.ExternalLogin,
                    FirstName = profile.FirstName,
                    LastName = profile.LastName,
                    Login = profile.Login,
                    Locked = false,
                    RequireChangePassword = true,
                    LastChangePassword = this.clock.Now,
                    FactEmployeeNo = profile.FactEmployee,   // #
                    AddressLine1 = profile.AddressLine1,
                    AddressLine2 = profile.AddressLine2,
                    AddressLine3 = profile.AddressLine3,
                    PostCode = profile.PostCode,
                    Phone = profile.Phone,
                    PhoneAlternate = profile.PhoneAlternate
                };

                using (var scope = Domain.Context.Write())
                {
                    var branch = scope.Context.BranchLookup.FirstOrDefault(b => b.branchno == profile.BranchNo);
                    user.BranchId = branch.BranchLocationId;

                    scope.Context.User.Add(user);
                    scope.Context.SaveChanges();
                    scope.Complete();
                }

                var encryptedPassword = user.PasswordEncrypt(profile.Password, container.GetInstance<IPasswordHashingAlgorithm>());
                using (var scope = Domain.Context.Write())
                {
                    var dbUser = scope.Context.User.Find(user.Id);
                    dbUser.Password = encryptedPassword;
                    scope.Context.SaveChanges();
                    scope.Complete();
                }

                userId = user.Id;

                SolrIndex.IndexUser(new[] { userId });
                audit.LogAsync(new { Profile = profile }, EventType.CreateUser, EventCategory.Admin);
                return RedirectToAction("Profile", new
                {
                    id = userId
                });
            }

            return View(profile);
        }

        public ActionResult Permissions(int id)
        {
            var user = new UserProfilePermissions()
            {
                Id = id
            };

            using (var scope = Domain.Context.Read())
            {

                user.Roles = (from r in scope.Context.Role
                              select new RoleSelect
                              {
                                  Id = r.Id,
                                  Name = r.Name
                              }).ToList();

                // All permissions to list
                user.Permissions = (from p in scope.Context.Permission
                                    join c in scope.Context.PermissionCategory on p.CategoryId equals c.Id
                                    where !p.IsDelegate
                                    select new EffectivePermissions
                                    {
                                        PermissionId = p.Id,
                                        Name = p.Name,
                                        Description = p.Description,
                                        CategoryName = c.Name
                                    })
                                    .ToList();

                //All permissions associated with user and roles.
                user.RolePermission = (from ur in scope.Context.UserRole
                                       join rp in scope.Context.RolePermission on ur.RoleId equals rp.RoleId
                                       join r in scope.Context.Role on rp.RoleId equals r.Id
                                       where ur.UserId == id
                                       orderby r.Name
                                       select new RolePermissionsDisplay
                                       {
                                           PermissionId = rp.PermissionId,
                                           Deny = rp.Deny,
                                           RoleId = rp.RoleId,
                                           RoleName = r.Name
                                       }).ToList();

                // Calc effective permission.
                user.Permissions.ForEach(p =>
                {
                    if (user.RolePermission.Where(a => p.PermissionId == a.PermissionId).Any())
                    {
                        p.Deny = user.RolePermission.Where(a => p.PermissionId == a.PermissionId && a.Deny).Any();
                    }

                });

                user.Permissions = user.Permissions.Where(p => p.Deny.HasValue).ToList();
            }



            return PartialView("UserPermissions", user);
        }

        [HttpPost]
        public ActionResult ChangePassword(string currentPassword, string newPassword, int userId)
        {
            var isValid = false;

            if (userId == this.GetUser().Id)
            {
                //user = ;
                var result = this.container.GetInstance<IUserValidation>().Validate(this.GetUser().Login, currentPassword);
                isValid = result.IsValid;
            }
            else
            {
                isValid = this.GetUser().HasPermission(AdminPermissionEnum.ChangeUsersPassword);
                if (!isValid)
                {
                    throw new PermissionException(Blue.Helpers.Humanize(AdminPermissionEnum.ChangeUsersPassword.ToString()));
                }
            }

            if (isValid)
            {
                BaseChangePassword changePassword;
                var changePasswordHandler = new ChangePasswordHandler();

                if (userId == this.GetUser().Id)
                {
                    changePassword = container.GetInstance<Domain.ChangePassword>();
                }
                else
                {
                    changePassword = container.GetInstance<Domain.ResetPassword>();
                }

                var changeResult = changePasswordHandler.HandleChangePassword(
                    UserRepository.GetUserById(userId),
                    newPassword,
                    changePassword, this.GetUser().Login.ToString());                                      //#11201

                if (changeResult == ChangePasswordResult.Ok)
                {
                    audit.LogAsync(new { User = userId }, EventType.ChangePassword, EventCategory.Admin);
                    return Json(new
                    {
                        Successful = true
                    });
                }
                return Json(new
                {
                    Successful = false,
                    Message = changeResult == ChangePasswordResult.TooSimple ? PasswordComplexityParameters.Current.GetFrendlyUserText() : PasswordResultText.GetMessage(changeResult)
                });
            }
            else
            {
                return new HttpUnauthorizedResult();
            }
        }

        [HttpGet]
        public JsonResult UsersWithPermission(int id)
        {
            return Json(repository.GetUsersWithPermission(id), JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public void AddProfile(UserProfile userProfile)
        {
            using (var scope = Context.Write())
            {
                scope.Context.AdditionalUserProfile.Add(new AdditionalUserProfile()
                {
                    ProfileId = userProfile.ProfileId,
                    UserId = userProfile.UserId
                });

                scope.Context.SaveChanges();
                scope.Complete();
            }
        }

        [HttpGet]
        public JsonResult LoadPickListUsers(short? branch, int[] permissions = null)
        {
            using (var scope = Domain.Context.Write())
            {
                var values = from usr in scope.Context.User
                             select usr;

                if (branch.HasValue)
                {
                    values = values.Where(p => p.BranchNo == branch.Value);
                }

                if (permissions != null && permissions.Any())
                {
                    values = from u in values
                             join ur in scope.Context.UserRole on u.Id equals ur.UserId
                             join rp in scope.Context.RolePermission on ur.RoleId equals rp.RoleId
                             where permissions.Contains(rp.PermissionId)
                             select u;
                }

                return Json(values
                    .ToList()
                    .Select(p => new PickListRow(p.Id.ToString(), p.FirstName + ' ' + p.LastName))
                    .ToList(), JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult LoadUsersBranches()
        {
            using (var scope = Domain.Context.Write())
            {
                var values = from usr in scope.Context.User
                             select usr;


                var t = values
                    .Select(p => new
                    {
                        p.Id,
                        p.BranchNo
                    })
                    .GroupBy(p => p.BranchNo)
                    .ToList()
                    .Select(p => new
                    {
                        Key = p.Key,
                        Ids = p.Select(b => b.Id).ToArray()
                    })
                    .ToDictionary(p => p.Key, f => f.Ids)
                    .ToList();

                var result = new Hashtable();

                foreach (var item in t)
                {
                    result.Add(item.Key.ToString(), item.Value);
                }

                return Json(result, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetLoggedInBranch()
        {
            var currentUser = HttpContext.GetUser();
            if (currentUser != null)
            {
                return Json(new { UserBranch = currentUser.Branch }, JsonRequestBehavior.AllowGet);
            }
            else throw new ApplicationException("No user currently logged in.");
        }
    }

    public class UsersPickList : IPickListProvider
    {
        internal UsersPickList()
        {
            this.Id = "USERS";
            this.Name = "List of all users in the application";
        }

        public string Id
        {
            get;
            private set;
        }

        public string Name
        {
            get;
            private set;
        }

        public System.Collections.Generic.IEnumerable<IPickListRow> Load()
        {
            using (var scope = Domain.Context.Write())
            {
                return scope.Context.User
                    .Select(p => p)
                    .ToList()
                    .Select(p => new PickListRow(p.Id.ToString(), p.FirstName + ' ' + p.LastName));
            }
        }
    }
}
