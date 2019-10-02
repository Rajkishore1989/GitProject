using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;
using Blue.Admin;
using Blue.Admin.Event;
using Blue.Admin.Solr;
using Blue.Cosacs.Web.Areas.Admin.Models;
using Blue.Events;
using StructureMap;
using Domain = Blue.Admin;
using System;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Admin.Controllers
{
    public class RolesController : FormInlineBaseController<Domain.Context, Domain.Role, Models.Role, RolesController.Search>
    {
        private readonly PermissionsRepository permissions;
        private readonly IEventStore audit;
        Blue.Admin.ISessionManager sessionManager;
        private readonly IContainer container;

        [Permission(Blue.Admin.AdminPermissionEnum.ViewRoles)]
        public override ActionResult Index(int? page, RolesController.Search s)
        {
            return base.Index(page, s);
        }

        public RolesController(IContainer container, IEventStore audit, PermissionsRepository permissions, Blue.Admin.ISessionManager sessionManager) 
        {
            this.container = container;
            this.audit = audit;
            this.permissions = permissions;
            this.sessionManager = sessionManager;
        }

        public class Search
        {
            public int? Id { get; set; }
            public string Name { get; set; }
        }

        protected override Transactions.WriteScope<Domain.Context> Write()
        {
            return Domain.Context.Write();
        }

        protected override Transactions.ReadScope<Domain.Context> Read()
        {
            return Domain.Context.Read();
        }

        protected override Models.Role ToModel(Domain.Role d)
        {
            return new Models.Role(d);
        }

        protected override DbSet<Domain.Role> Query(Domain.Context ctx)
        {
            return ctx.Role;
        }

        protected override IQueryable<Domain.Role> Filter(IQueryable<Domain.Role> query, Search search)
        {
            if (search == null)
                return query;

            if (search.Id != null)
                query = query.Where(q => q.Id == search.Id.Value);

            if (!string.IsNullOrEmpty(search.Name))
                query = query.Where(q => q.Name.Contains(search.Name));

            return query;
        }

        protected override void OnUpdating(Domain.Context ctx, Models.Role m, Domain.Role d)
        {
            d.Name = m.Name;
            audit.LogAsync(new { Old = m, New = d }, EventType.RoleUpdate, EventCategory.Admin);
        }

        protected override void OnCreating(Domain.Context ctx, Models.Role m, Domain.Role d)
        {
            d.Name = m.Name;
        }

        protected override void OnCreated(Domain.Context ctx, Models.Role m, Domain.Role d)
        {
            base.OnCreated(ctx, m, d);
            m.Id = d.Id;
            audit.LogAsync(new { New = d }, EventType.RoleCreate, EventCategory.Admin);

        }

        protected override void OnDeleting(Domain.Role d, Domain.Context ctx)
        {
            if (ctx.UserRole.Any(p=> p.RoleId == d.Id))
            {
                throw new ApplicationException("Cannot delete this role because it's linked to existing users.");
            }
        }

        [Permission(Blue.Admin.AdminPermissionEnum.ViewRoles)]
        public ActionResult Permissions(int id)
        {
            using (var scope = Domain.Context.Read())
            {
                var superUser = this.GetUser().PermissionIds.Contains((int)AdminPermissionEnum.SuperUser);
                var rolePermission = (from r in scope.Context.Role
                                      where r.Id == id
                                      select new Models.RolePermissions
                                      {
                                          Id = r.Id,
                                          Name = r.Name
                                      }).First();

                var permissions = ((from p in scope.Context.Permission
                                    join rp in scope.Context.RolePermission on p.Id equals rp.PermissionId into rpj
                                    join pc in scope.Context.PermissionCategory on p.CategoryId equals pc.Id
                                    from rpsub in rpj.Where(i => i.RoleId == id).DefaultIfEmpty()
                                    where p.Id != 57 && p.Id != 59 && !p.IsDelegate//Exclude Edit Scoring Rules, Edit Scoring Matrix
                                    select new Models.Permissions
                                    {
                                        CategoryId = p.CategoryId,
                                        CategoryName = pc.Name,
                                        Description = p.Description,
                                        Name = p.Name,
                                        PermissionId = p.Id,
                                        Active = rpsub != null && !rpsub.Deny,
                                        Deny = rpsub != null && rpsub.Deny
                                    }).OrderBy(c => c.CategoryName)
                                   .Concat(from p in scope.Context.Permission             //#12362
                                           join rp in scope.Context.RolePermission on p.Id equals rp.PermissionId into rpj
                                           join pc in scope.Context.PermissionCategory on p.CategoryId equals pc.Id
                                           from rpsub in rpj.Where(i => i.RoleId == id).DefaultIfEmpty()
                                           where superUser && (p.Id == 57 || p.Id == 59) && !p.IsDelegate //If Super User include these permissions
                                           select new Models.Permissions
                                           {
                                               CategoryId = p.CategoryId,
                                               CategoryName = pc.Name,
                                               Description = p.Description,
                                               Name = p.Name,
                                               PermissionId = p.Id,
                                               Active = rpsub != null && !rpsub.Deny,
                                               Deny = rpsub != null && rpsub.Deny
                                           }).OrderBy(c => c.CategoryName))
                                    .ToList();


                if (this.GetUser().PermissionIds.Contains((int)AdminPermissionEnum.SuperUser))
                {
                    if (!permissions.Any(p => p.PermissionId == (int)AdminPermissionEnum.SuperUser))
                    {
                        permissions.Insert(0, new Models.Permissions
                                              {
                                                  CategoryId = 100,
                                                  CategoryName = "Super User",
                                                  Description = "Grant user SuperUser powers",
                                                  Name = "SuperUser",
                                                  PermissionId = (int)AdminPermissionEnum.SuperUser
                                              });
                    }
                    else
                    {
                        var su = permissions.Find(p => p.PermissionId == (int)AdminPermissionEnum.SuperUser);
                        permissions.Remove(su);
                        permissions.Insert(0, su);
                    }
                }
                else
                    if (permissions.Any(p => p.PermissionId == (int)AdminPermissionEnum.SuperUser))
                    {
                        var su = permissions.Find(p => p.PermissionId == (int)AdminPermissionEnum.SuperUser);
                        permissions.Remove(su);
                    }
                rolePermission.Permissions = permissions;
                return View(rolePermission);
            }
        }

        [Permission(Blue.Admin.AdminPermissionEnum.ViewRoles)]
        public ActionResult Users(int id)
        {
            using (var scope = Domain.Context.Read())
            {

                var userRoles = (from r in scope.Context.Role
                                 where r.Id == id
                                 select new Models.UserRoles
                                 {
                                     Id = r.Id,
                                     Name = r.Name
                                 }).FirstOrDefault();

                userRoles.Users = (from ur in scope.Context.UserRole
                                   join u in scope.Context.User on ur.UserId equals u.Id
                                   where ur.RoleId == id
                                   select new Models.Users
                                   {
                                       Id = ur.UserId,
                                       UserName = u.Login,
                                       FirstName = u.FirstName,
                                       LastName = u.LastName
                                   }).ToList();

                return View(userRoles);
            }
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.EditRoles)]
        public void AllowDeny(Models.RolePermissionRequest r)
        {
            string roleName;
            using (var scope = Domain.Context.Write())
            {
                var record = (from rp in scope.Context.RolePermission
                              where rp.RoleId == r.Role && rp.PermissionId == r.Permission
                              select rp).FirstOrDefault();

                if (record != null)
                    scope.Context.RolePermission.Remove(record);

                if (r.Allow || r.Deny)
                {
                    scope.Context.RolePermission.Add(new Domain.RolePermission
                    {
                        RoleId = r.Role,
                        PermissionId = r.Permission,
                        Deny = r.Deny
                    });
                }
                scope.Context.SaveChanges();
                roleName = scope.Context.Role.Find(r.Role).Name;

                //kill all users session with this permission
                var usersInRole = scope.Context.UserRole
                    .Where(p=> p.RoleId == r.Role)
                    .Select(p=> p.UserId)
                    .ToList();

                foreach (var userId in usersInRole)
                {
                    sessionManager.Kill(userId);
                }

                scope.Complete();
            }
            
            var permissionRepository = new PermissionsRepository();

            audit.LogAsync(new
            {
                Role = roleName,
                Deny = r.Allow || r.Deny ? r.Deny : (bool?)null,
                Permission = new
                {
                    Id = r.Permission,
                    Name = permissionRepository.All()[r.Permission].Name,
                    Category = permissionRepository.All()[r.Permission].Category,
                }
            }, EventType.ChangePermission, EventCategory.Admin);
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.EditRoles)]
        public void AllowDenyByCategory(RolePermissionsByCategory parameters)
        {
            using (var scope = Domain.Context.Write())
            {
                var permissions = (from r in scope.Context.RolePermission
                                   join p in scope.Context.Permission on r.PermissionId equals p.Id
                                   where r.RoleId == parameters.RoleId &&
                                         p.CategoryId == parameters.CategoryId
                                   select r).ToList();

                permissions.ForEach(r => { scope.Context.RolePermission.Remove(r); });

                if (parameters.Check)
                {
                    var defaultPermissions = (from p in scope.Context.Permission
                                              where p.CategoryId == parameters.CategoryId
                                              select p).ToList();

                    defaultPermissions.ForEach(d =>
                    {
                        scope.Context.RolePermission.Add(new RolePermission
                        {
                            Deny = !parameters.Allow,
                            PermissionId = d.Id,
                            RoleId = parameters.RoleId
                        });
                    });
                }
                scope.Context.SaveChanges();
                scope.Complete();
            }
            audit.LogAsync(new
            {
                Role = parameters.RoleId,
                Category = parameters.CategoryId,
                Action = parameters.Check ? parameters.Allow ? "Allow All" : "Deny All" : "Remove All"
            }, EventType.ChangePermissionGroup, EventCategory.Admin);
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.EditRoles)]
        public ActionResult UnassignUserAndReturnPermissions(Domain.UserRole r)
        {
            UnassignUser(r);
            return RedirectToAction("Permissions", "Users", new { id = r.UserId });
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.EditRoles)]
        public ActionResult AddRoleAndReturnPermissions(Domain.UserRole r)
        {
            string username = string.Empty;
            string rolename = string.Empty;

            using (var scope = Domain.Context.Write())
            {
                if (!scope.Context.UserRole.Where(ur => ur.RoleId == r.RoleId && ur.UserId == r.UserId).Any())
                {
                    var role = new UserRole()
                    {
                        RoleId = r.RoleId,
                        UserId = r.UserId
                    };
                    scope.Context.UserRole.Add(role);
                    username = scope.Context.User.Find(r.UserId).FullName;
                    rolename = scope.Context.Role.Find(r.RoleId).Name;
                    scope.Context.SaveChanges();
                    SolrIndex.IndexUser(new[] { r.UserId });
                    audit.LogAsync(new
                    {
                        Role = rolename,
                        RoleId = r.RoleId,
                        User = username,
                        UserId = r.UserId
                    }, EventType.AddRoleToUser, EventCategory.Admin);
                }
                scope.Complete();
            }
            return RedirectToAction("Permissions", "Users", new
            {
                id = r.UserId
            });
        }

        [HttpPost]
        [Permission(Blue.Admin.AdminPermissionEnum.EditRoles)]
        public void UnassignUser(Domain.UserRole r)
        {
            string username = string.Empty;
            string rolename = string.Empty;

            using (var scope = Domain.Context.Write())
            {
                var record = (from ur in scope.Context.UserRole
                              where ur.RoleId == r.RoleId && ur.UserId == r.UserId
                              select ur).FirstOrDefault();

                if (record != null)
                {
                    scope.Context.UserRole.Remove(record);
                    username = scope.Context.User.Find(r.UserId).FullName;
                    rolename = scope.Context.Role.Find(r.RoleId).Name;
                    scope.Context.SaveChanges();
                    SolrIndex.IndexUser(new[] { r.UserId });
                    audit.LogAsync(new
                    {
                        Role = rolename,
                        RoleId = r.RoleId,
                        User = username,
                        UserId = r.UserId
                    }, EventType.RemoveRoleFromUser, EventCategory.Admin);
                }
                scope.Complete();
            }
        }

        [HttpGet]
        public JsonResult GetRoles(RoleSearch s)
        {
            using (var scope = Domain.Context.Read())
            {
                return Json(new RoleResults
                {
                    Roles = scope.Context.Role.ToList(),  //.Where(u => u.Name.Contains(s.q)).OrderBy(d => d.Name).Skip(s.page_limit * (s.page - 1)).Take(s.page_limit).ToList(),
                    total = scope.Context.User.Where(d => d.FirstName.Contains(s.q)).Count()
                }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}
