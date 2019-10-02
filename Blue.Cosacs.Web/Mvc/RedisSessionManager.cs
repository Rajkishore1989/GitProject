using Blue.Admin;
using System;
using System.Linq;
using System.Collections.Generic;
using Blue.Events;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using StackExchange.Redis;

namespace Blue.Glaucous.Client
{
    public class RedisSessionManager : ISessionManager
    {
        private readonly IClock clock;
        private readonly IEventStore audit;

        private const string EventCategory = "Security";

        public RedisSessionManager(IClock clock, IEventStore audit)
        {
            this.clock = clock;
            this.audit = audit;
        }

        private static IDatabase Redis()
        {
            return RedisConnection.Database();
        }

        // {User.Id}|{Session.Id}
        private static string FormatCookie(UserSession session)
        {
            return string.Format("{0}|{1}", session.Id, session.SessionId);
        }

        private const string RedisSessionKeyPrefix = "Admin:Sessions:Users:";

        private static string RedisSessionKey(int userId) 
        {
            return string.Format("{0}{1}", RedisSessionKeyPrefix, userId);
        }

        private HashEntry[] ToRedis(UserSession session)
        {
            return new HashEntry[] 
            {
                new HashEntry("Login", session.Login),
                new HashEntry("SessionId", session.SessionId),
                new HashEntry("ClientMachine", session.ClientMachine ?? string.Empty),
                new HashEntry("LastRequestOn", session.LastRequestOn.ToUnixTime()),
                new HashEntry("Branch", session.Branch),
                new HashEntry("BranchName", session.BranchName ?? string.Empty),
                new HashEntry("FullName", session.FullName ?? string.Empty),
                new HashEntry("Permissions", string.Join(",", session.PermissionIds)),
            };
        }

        public void Login(UserSession session)
        {
            // generate the next session ID from Redis
            session.SessionId = Redis().StringIncrement("Admin:Sessions:Next").ToString();
            session.ClientMachine = HttpContext.Current.Request.UserHostName;
            UpdateSession(session, updateInRedis: false);
            Redis().HashSet(RedisSessionKey(session.Id), ToRedis(session));

            FormsAuthentication.SetAuthCookie(FormatCookie(session), createPersistentCookie: false);
            // in the thread/context we place the User.Id
            HttpContext.Current.User = new GenericPrincipal(new GenericIdentity(session.Id.ToString()), new string[0]);
            audit.LogAsync(new { }, "Login", EventCategory);
        }

        private void UpdateSession(UserSession session, bool updateInRedis)
        {
            //sessions[session.Id] = session;
            //session.SessionId = HttpContext.Current.Session.SessionID;
            session.LastRequestOn = clock.UtcNow;
            if (updateInRedis)
            {
                Redis().HashSet(RedisSessionKey(session.Id), new HashEntry[] { new HashEntry("LastRequestOn", session.LastRequestOn.ToUnixTime()) });
            }
        }

        public void Logout(UserSession session, bool forced = false)
        {
            audit.LogAsync(new { }, forced ? "Forced Logout" : "Logout", EventCategory);

            FormsAuthentication.SignOut();
            // no longer used: HttpContext.Current.Session.Abandon();

            if (IsValid(session))
            {
                Redis().KeyDelete(RedisSessionKey(session.Id)); // sessions.Remove(session.Id);
            }
        }

        public bool IsValid(UserSession session)
        {
            if (session == null)
            {
                return false;
            }

            // is this the same sessionId than the one in Redis for this user?
            var sessionId = Redis().HashGet(RedisSessionKey(session.Id), "SessionId");
            if (sessionId == session.SessionId)
            {
                UpdateSession(session, updateInRedis: true);
                return true;
            }
            return false;
        }

        private UserSession Get(int userId) 
        {
            var entries = Redis().HashGetAll(RedisSessionKey(userId));
            return Deserialize(userId, entries);
        }

        private static UserSession Deserialize(int userId, HashEntry[] entries)
        {
            if (entries == null || entries.Length == 0)
            {
                return null;
            }

            var session = new UserSession();
            session.Id = userId;
            foreach (var entry in entries)
            {
                switch (entry.Name)
                {
                    case "Login":
                        session.Login = entry.Value;
                        break;
                    case "SessionId":
                        session.SessionId = entry.Value;
                        break;
                    case "ClientMachine":
                        session.ClientMachine = entry.Value;
                        break;
                    case "LastRequestOn":
                        session.LastRequestOn = long.Parse(entry.Value).FromUnixTime();
                        break;
                    case "Branch":
                        session.Branch = short.Parse(entry.Value);
                        break;
                    case "BranchName":
                        session.BranchName = entry.Value;
                        break;
                    case "FullName":
                        session.FullName = entry.Value;
                        break;
                    case "Permissions":
                        session.PermissionIds = entry.Value.ToString().Split(',').Select(s => int.Parse(s)).ToArray();
                        break;
                }
            }
            return session;
        }

        public void Kill(int userId)
        {
            var sessionToKill = Get(userId);

            if (sessionToKill != null)
            {
                Redis().KeyDelete(RedisSessionKey(userId));
                audit.Log(new { KillSession = sessionToKill.Login }, "Kill Session", EventCategory, null);
            }
        }
       
        public int SessionCount()
        {
            // not efficient at all... but rarely used, so we leave it..
            return RedisConnection.Server().Keys(pattern: RedisSessionKeyPrefix + "*").Count();
        }

        public IList<UserSession> Sessions()
        {
            var result = new List<UserSession>();
            foreach (var key in RedisConnection.Server().Keys(pattern: RedisSessionKeyPrefix + "*"))
            {
                var userId = int.Parse(((string)key).Replace(RedisSessionKeyPrefix, string.Empty));
                result.Add(Get(userId));
            }
            return result;
        }

        public UserSession Current()
        {
            var identity = HttpContext.Current.User.Identity;
            if (!identity.IsAuthenticated) 
            {
                return null;
            }
            var userId = int.Parse(identity.Name.Split('|')[0]); // UserId|SessionId
            return Get(userId);
        }
    }
}
