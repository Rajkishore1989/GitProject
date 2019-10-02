using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Controllers;
using Message = Blue.Cosacs.Messages.Merchandising.Cints;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    public class CINTSubscriberController : HttpHubSubscriberController<Message.CintOrderSubmit>
    {
        private readonly ICINTRepository cintRepository;

        public CINTSubscriberController(ICINTRepository cintRepository)
        {
            this.cintRepository = cintRepository;
        }

        protected override void Sink(int id, Message.CintOrderSubmit message)
        {
            cintRepository.Create(message, id);
        }
    }
}