using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Web.Models;
using Blue.Hub.Client;
using Blue.Hub.Server;
using Blue.Data;
using System;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class HubController : Controller
    {
        public HubController(IHub hub, IPublisher publisher)
        {
            this.hub = hub;
            this.publisher = publisher;
        }

        private readonly IHub hub;
        private readonly IPublisher publisher;

        [HttpGet]
        [Permission(Admin.AdminPermissionEnum.ViewHub)]
        public ActionResult Index()
        {
            return View(hub.Queues());
        }

        [HttpGet]
        [Permission(Admin.AdminPermissionEnum.ViewHub)]
        public ActionResult Messages(int id)
        {
            var queue = hub.Queues().FirstOrDefault(q => q.Id == id);

            return View(queue);
        }

        [HttpGet]
        [Permission(Admin.AdminPermissionEnum.ViewHub)]
        public ActionResult MessagesForQueue(int id)
        {
            var initialMessages = hub.Messages(id, null, new[] { MessageState.Initial }, mostRecentFirst: true);
            var poisonMessages = hub.Messages(id, null, new[] { MessageState.Poison }, mostRecentFirst: true);
            var pending = new HubMessagesPending
            {
                Queue = hub.Queues().FirstOrDefault(q => q.Id == id),
                Initial = initialMessages,
                Poison = poisonMessages
            };

            return Json(pending, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(Admin.AdminPermissionEnum.ViewHub)]
        public ActionResult InitialMessagesForQueue(int id, int pageNumber = 1)
        {
            var messages = hub.Messages(id, null, new[] { MessageState.Initial }, pageNumber: pageNumber, mostRecentFirst: true);
            return Json(messages, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(Admin.AdminPermissionEnum.ViewHub)]
        public ActionResult PoisonMessagesForQueue(int id, int pageNumber = 1)
        {
            var messages = hub.Messages(
                queueId: id, 
                createdOn: null,     
                states: new[] { MessageState.Poison },      
                pageNumber: pageNumber, 
                mostRecentFirst: true
                );
            return Json(messages, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public void ReprocessQueue(int queueId)
        {
            publisher.ReprocessQueue(queueId);
        }

        [HttpPost]
        public void ReprocessQueueMessage(int queueId, int messageId)
        {
            publisher.ReprocessQueueMessage(queueId, messageId);
        }
    }

    public class DefaultQueueStatistics : IQueueStatistics
    {
        public int Count
        {
            get { return 0; }
        }

        public MessageState State
        {
            get { return null; }
        }
    }
}
