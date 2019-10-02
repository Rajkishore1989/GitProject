using System.Linq;
using System.Security.Principal;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Blue.Admin;

namespace Blue.Glaucous.Client.Mvc
{
    /// <summary>
    /// This filter prevents access to a controller action when there is no valid asp.net authentication cookie.
    /// Exceptions are actions with the attribute [Public].
    /// Returns 401 Unauthorized (instead of redirecting to the logon page).
    /// </summary>
    public class BlockUnauthorizedFilter : IAuthorizationFilter
    {
        public BlockUnauthorizedFilter(ISessionManager sessionManager, IUserValidation passwordValidation)
        {
            this.sessionManager = sessionManager;
            this.passwordValidation = passwordValidation;
        }

        private readonly ISessionManager sessionManager;
        private readonly IUserValidation passwordValidation;

        public void OnAuthorization(AuthorizationContext filterContext)
        {
            Authenticate(filterContext.HttpContext);

            if (!filterContext.HttpContext.Request.IsAuthenticated)
            {
                var action = filterContext.ActionDescriptor;
                var isPublic = action.GetCustomAttributes(typeof(PublicAttribute), true).Any();
                if (isPublic)
                {
                    return;
                }

                if (filterContext.HttpContext.Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    Unauthorized(filterContext);
                }
                else
                {
                    filterContext.Result = new RedirectResult("/login/");
                }
            }
            else
            {
                var session = filterContext.HttpContext.GetUser();

                if (session == null)
                {
                    // valid cookie but session was lost, let's restore the UserSesison object
                    session = passwordValidation.CreateUserSession(filterContext.HttpContext.User.Identity.Name);
                    //filterContext.HttpContext.SetUser(session);
                    sessionManager.Login(session);
                }
                else if (!sessionManager.IsValid(session))
                {
                    sessionManager.Logout(session, forced: true);
                    Unauthorized(filterContext);
                }
            }
        }

        private static void Unauthorized(AuthorizationContext filterContext)
        {
            if (filterContext.HttpContext.Request.Path == "/")
            {
                filterContext.Result = new RedirectResult("/login/");
                return;
            }

            var result = new ViewResult
            {
                ViewName = "Unauthorized",
                //MasterName = this.Master,
                //ViewData = new ViewDataDictionary<HandleErrorInfo>(model),
                TempData = filterContext.Controller.TempData,
            };
            filterContext.Result = result;

            var ctx = filterContext.HttpContext;
            ctx.Response.Clear();
            ctx.Response.StatusCode = 401; // Unauthorized
            ctx.Response.StatusDescription = "Unauthorized";
            ctx.Response.TrySkipIisCustomErrors = true;
        }

        private void Authenticate(HttpContextBase httpContext)
        {
            HttpCookie cookie = null;
            var ticketFromCookie = ExtractTicketFromCookie(httpContext, FormsAuthentication.FormsCookieName);
            if (ticketFromCookie == null || ticketFromCookie.Expired)
            {
                return;
            }
            var ticket = ticketFromCookie;
            if (FormsAuthentication.SlidingExpiration)
            {
                ticket = FormsAuthentication.RenewTicketIfOld(ticketFromCookie);
            }

            if (ticket != null)
            {
                httpContext.User = new GenericPrincipal(new FormsIdentity(ticket), new string[0]);

                if (!ticket.CookiePath.Equals("/"))
                {
                    cookie = httpContext.Request.Cookies[FormsAuthentication.FormsCookieName];
                    if (cookie != null)
                    {
                        cookie.Path = ticket.CookiePath;
                    }
                }
                if (ticket == ticketFromCookie)
                {
                    return;
                }
                var cookieValue = FormsAuthentication.Encrypt(ticket);

                if (cookie != null)
                {
                    cookie = httpContext.Request.Cookies[FormsAuthentication.FormsCookieName];
                }
                if (cookie == null)
                {
                    cookie = new HttpCookie(FormsAuthentication.FormsCookieName, cookieValue);
                    cookie.Path = ticket.CookiePath;
                }
                if (ticket.IsPersistent)
                {
                    cookie.Expires = ticket.Expiration;
                }
                cookie.Value = cookieValue;
            }
            if (cookie == null)
            {
                return;
            }

            cookie.Secure = FormsAuthentication.RequireSSL;
            cookie.HttpOnly = true;
            if (FormsAuthentication.CookieDomain != null)
            {
                cookie.Domain = FormsAuthentication.CookieDomain;
            }
            httpContext.Response.Cookies.Remove(cookie.Name);
            httpContext.Response.Cookies.Add(cookie);
        }

        private static FormsAuthenticationTicket ExtractTicketFromCookie(HttpContextBase context, string name)
        {
            var httpCookie = context.Request.Cookies[name];

            FormsAuthenticationTicket ticket = null;
            string str = null;

            if (httpCookie != null)
            {
                str = httpCookie.Value;
            }

            if (str != null && str.Length > 1)
            {
                try
                {
                    ticket = FormsAuthentication.Decrypt(str);
                }
                catch
                {
                    context.Request.Cookies.Remove(name);
                }

                // && (cookielessTicket || !FormsAuthentication.RequireSSL || context.Request.IsSecureConnection))
                if (ticket != null && !ticket.Expired) 
                {
                    return ticket;
                }

                ticket = null;
                context.Request.Cookies.Remove(name);
            }

            if (ticket == null || ticket.Expired)
            {
                return null;
            }

            var cookie = new HttpCookie(name, str) { HttpOnly = true, Path = ticket.CookiePath };

            if (ticket.IsPersistent)
            {
                cookie.Expires = ticket.Expiration;
            }
            cookie.Secure = FormsAuthentication.RequireSSL;
            if (FormsAuthentication.CookieDomain != null)
            {
                cookie.Domain = FormsAuthentication.CookieDomain;
            }
            context.Response.Cookies.Remove(cookie.Name);
            context.Response.Cookies.Add(cookie);

            return ticket;
        }
    }
}