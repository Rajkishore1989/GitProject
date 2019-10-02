using System.Threading;

namespace Blue.Cosacs.Web.Common
{
    public class EventStore : Blue.Events.EventStoreBase
    {
        private EventStore() : base("Default") { }

        protected override string EventBy
        {
            get { return Thread.CurrentPrincipal.Identity.Name; }
        }

        public static readonly Blue.Events.IEventStore Instance = new EventStore();
    }
}
