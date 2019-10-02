using System;
using System.Linq;
using System.Web.Mvc;
using Blue.Admin;
using Blue.Admin.Email;
using Blue.Admin.Event;
using Blue.Admin.Model;
using Blue.Admin.Password;
using Blue.Cosacs.Web.Common;
using Blue.Cosacs.Web.Models;
using Blue.Events;
using Domain = Blue.Admin;
using Blue.Glaucous.Client;

namespace Blue.Cosacs.Web.Controllers
{
    public class LoginController : Controller
    {
        private readonly StructureMap.IContainer container;
        private readonly IEventStore audit;
        private readonly IMailUser mail;
        private readonly Admin.UserRepository userRepository;
        private readonly Blue.Admin.Settings adminSettings;
        private readonly Blue.Admin.AutoLockoutManager autolockoutManager;

        public LoginController(StructureMap.IContainer container, IEventStore audit, IMailUser mail, Admin.UserRepository userRepository, Blue.Admin.Settings adminSettings, Blue.Admin.AutoLockoutManager autolockoutManager)
        {
            this.container = container;
            this.audit = audit;
            this.mail = mail;
            this.userRepository = userRepository;
            this.adminSettings = adminSettings;
            this.autolockoutManager = autolockoutManager;
        }

        [Public]
        [HttpPost]
        public ActionResult Index(string username, string password, string newPassword)
        {
            if (!autolockoutManager.IsClientLocked(this.Request)) //Client non Locked 
            {
                var result = container.GetInstance<IUserValidation>().Validate(username, password);

                if (result.IsValid && !result.IsLocked)
                {
                    autolockoutManager.EmptyFailedAttemptsList(this.Request);

                    if (result.UserMustChangePassword)
                    {
                        if (!string.IsNullOrWhiteSpace(newPassword))
                        {
                            var changePasswordHandler = new ChangePasswordHandler();

                            switch (changePasswordHandler.HandleChangePassword(
                                    UserRepository.GetUserByLogin(username),
                                    newPassword,
                                    container.GetInstance<Domain.ChangePassword>(), username))
                            {
                                case ChangePasswordResult.Ok:
                                    WriteCookie(result.User);
                                    return Code(ChangePasswordResult.Ok, result.User);

                                case ChangePasswordResult.TooSimple:
                                    return Code(ChangePasswordResult.TooSimple, PasswordComplexityParameters.Current.GetFrendlyUserText(), result.User);

                                case ChangePasswordResult.EqualsOld:
                                    return Code(ChangePasswordResult.EqualsOld, Resources.NewOldPasswordAreEqueal, result.User);

                                case ChangePasswordResult.TooCommon:
                                    return Code(ChangePasswordResult.TooCommon, Resources.PasswordTooCommon, result.User);
                            }
                        }
                        return Code(ChangePasswordResult.MustChange, Resources.MustChangePassword, result.User);
                    }
                    else
                    {
                        WriteCookie(result.User);
                        return Code(ChangePasswordResult.Ok, result.User);
                    }
                }
                else
                {
                    Response.StatusCode = 401;
                    if (!result.IsValid)
                    {
                        //store the failed attempt to a cache hashtable
                        autolockoutManager.StoreFailedAttempt(this.Request);
                    }
                    return Json(new { locked = result.IsLocked, lockedMessage = adminSettings.LockedUserMessage });
                }
            }
            else //Client Locked
            {
                Response.StatusCode = 401;
                return Json(new { locked = true, lockedMessage = adminSettings.AutoLockoutLockedClientMessage });
            }
        }

        private void WriteCookie(UserSession user)
        {
            //this.SetUser(user);
            container.GetInstance<ISessionManager>().Login(user);
            user.BranchName = this.GetBranch(user.Branch);
        }

        private string GetBranch(short branchNo)
        {

            using (var scope = Domain.Context.Read())
            {
                // User info
                var branch = (from bv in scope.Context.BranchLookup
                              where bv.branchno == branchNo
                              select bv.BranchNameLong).First();
                return branch;
            }
        }

        private JsonResult Code(ChangePasswordResult c, string adicionalMessage, UserSession userSession)
        {
            return Json(new
            {
                Result = c.ToString(),
                Message = adicionalMessage,
                User = new
                {
                    BranchNumber = userSession.Branch,
                    BranchName = userSession.BranchName,
                    MenuItems = new Menu().GetMenuItems()
                }
            }, JsonRequestBehavior.AllowGet);
        }

        private JsonResult Code(ChangePasswordResult c, UserSession userSession)
        {
            return Code(c, string.Empty, userSession);
        }

        [Public]
        [HttpPost]
        public JsonResult RecoverPassword(string userName)
        {
            var req = this.container.GetInstance<IForgetPasswordRequestHandler>();

            var resp = new ForgetPasswordResponse()
            {
                Successful = false,
                Comments = Resources.NoPossibleSendeMail
            };

            try
            {
                resp = req.RequestPasswordChange(userName);
            }
            catch (ArgumentException ex)
            {
                resp.Comments = ex.Message;
            }
            catch (NullReferenceException ex2)
            {
                resp.Comments = ex2.Message;
            }


            if (resp.Successful)
            {
                try
                {
                    this.SendRequestChangePasswordeMail(resp.UsereMail, userName, resp.Token);
                }
                catch (EmailException ex)
                {
                    resp.Comments = ex.Message;
                    resp.Successful = false;
                }
            }

            return Json(new
            {
                Successful = resp.Successful,
                Comments = resp.Comments
            });
        }

        [Public]
        [HttpGet]
        public ActionResult RecoverPassword(string user, string token)
        {
            var hasExpire = false;

            if (!this.ValidateRequesChangePasswordToken(user, token))
            {
                hasExpire = true;
            }

            ViewBag.UserName = user;
            ViewBag.Token = token;
            return View(new RecoverPassword()
            {
                RequestExpired = hasExpire
            });
        }

        [Public]
        [HttpPost]
        public ActionResult ChangePassword(string user, string token, string newPassword)
        {
            if (!this.ValidateRequesChangePasswordToken(user, token))
            {
                Response.StatusCode = 401; // Unauthorized
                Response.StatusDescription = "Invalid Password Recover Request";
                return null;
            }

            var changePasswordHandler = new ChangePasswordHandler();
            var changeResult = changePasswordHandler.HandleChangePassword(
                    UserRepository.GetUserByLogin(user),
                    newPassword,
                    container.GetInstance<Domain.ResetPassword>(), user);              // #11201

            if (changeResult == ChangePasswordResult.Ok)
            {
                this.DeleteToken(token);
                this.Index(user, newPassword, null);

                audit.LogAsync(new { User = user }, EventType.ChangePassword, EventCategory.Admin);

                var newPage = Url.Action("", "", null, "HTTP");
                return Json(new
                {
                    Result = changeResult.ToString(),
                    NewPage = newPage
                });
            }
            else
            {
                return Code(changeResult, changeResult == ChangePasswordResult.TooSimple ? PasswordComplexityParameters.Current.GetFrendlyUserText() : PasswordResultText.GetMessage(changeResult), null);
            }
        }

        private void DeleteToken(string token)
        {
            var req = this.container.GetInstance<IForgetPasswordRequestHandler>();
            req.DeleteToken(token);
        }

        private bool ValidateRequesChangePasswordToken(string user, string token)
        {
            var req = this.container.GetInstance<IForgetPasswordRequestHandler>();
            return req.IsRequestPasswordChangeValid(user, token);
        }

        private void SendRequestChangePasswordeMail(string recipient, string userName, string token)
        {
            var id = userRepository.LoadByLogin(userName).Id;
            mail.Send(new EmailMessage()
            {
                UserId = id,
                Subject = "Reset your password",
                Body = string.Format(@"
			   <p>We have received a request to reset your password.</p>
			   If you want to reset your password, click on the link below (or copy and paste the URL into your browser)</br>
			   <a href=""{0}"">{0}</a>
			   <p>This link takes you to a secure page where you can change your password. 
			   If you don't want to reset your password, please ignore this message and your password will not be reset.</p> <p>If you have any concerns, please contact  Support.</p>
			   <p>Please do not reply to this email.</p>
			   Thanks,</br>Courts Team.", Url.Action("RecoverPassword", "Login", new
                                        {
                                            user = userName,
                                            token = token
                                        }, "HTTP"))

            });
        }
    }
}
