using Blue.Data;
using Blue.Hub.Server;

namespace Blue.Cosacs.Web.Models
{
    public class HubMessagesPending
    {
        public IQueueWithStatistics Queue { get; set; }
        public HubPagedResults<IMessage> Initial { get; set; }
        public HubPagedResults<IMessage> Poison { get; set; }
    }
}