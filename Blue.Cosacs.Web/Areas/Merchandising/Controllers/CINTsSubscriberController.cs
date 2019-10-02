using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Controllers;
using Blue.Hub.Client;
using System;
using System.Linq;
using Message = Blue.Cosacs.Messages.Merchandising.Cints;
using Model = Blue.Cosacs.Merchandising.Model;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{


    public class CINTsSubscriberController : HttpHubSubscriberController<Message.CintSubmit>
    {
        private readonly IPublisher publisher;
        private readonly ICINTRepository cintRepository;
        private readonly IClock clock;
        private readonly ICintErrorRepository cintErrorRepository;

        public CINTsSubscriberController(IPublisher publisher, ICINTRepository cintRepository, IClock clock, ICintErrorRepository cintErrorRepository)
        {
            this.publisher = publisher;
            this.cintRepository = cintRepository;
            this.clock = clock;
            this.cintErrorRepository = cintErrorRepository;
        }

        private void SaveError(int id, int runno, string message)
        {
            cintErrorRepository.SaveBulkError(new CintsError
            {
                MessageId = id,
                CreatedOn = clock.Now,
                Runno = runno,
                Exception = message
            });
        }

        protected override void Sink(int id, Message.CintSubmit msg)
        {
            try
            {
                if ((msg.CintOrder == null || !msg.CintOrder.Any()) && msg.DeliveriesTotal == 0 && msg.OrdersDeliveriesTotal == 0)
                {
                    return;
                }

                if ((msg.CintOrder == null || !msg.CintOrder.Any()) && (msg.DeliveriesTotal != 0 || msg.OrdersDeliveriesTotal != 0))
                {
                    var error = "No orders were sent but totals have values";
                    SaveError(id, msg.RunNo, error);
                    throw new MessageValidationException(error, null);
                }

                var deliveriesTotal = msg.CintOrder.Where(o => o.Type != "RegularOrder" && o.Type != "CancelOrder").Sum(o => o.Price * o.Quantity);
                var allTotal = msg.CintOrder.Sum(o => o.Price * o.Quantity);

                if (deliveriesTotal != msg.DeliveriesTotal)
                {
                    var error = string.Format("The totals of all orders does not match the delivery total, Total is {0} and message says {1}", deliveriesTotal, msg.DeliveriesTotal);
                    SaveError(id, msg.RunNo, error);
                    throw new MessageValidationException(error, null);
                }

                if (allTotal != msg.OrdersDeliveriesTotal)
                {
                    var error = string.Format("The totals of all deliveries does not match the orders deliveries total, Total is {0} and message says {1}", allTotal, msg.OrdersDeliveriesTotal);
                    SaveError(id, msg.RunNo, error);
                    throw new MessageValidationException(error, null);
                }

                using (var scope = Context.Write())
                {
                    if (scope.Context.CintRun.Any(c => c.RunId == msg.RunNo))
                    {
                        throw new MessageValidationException(string.Format("A message has already been processed with RunNo ({0})", msg.RunNo), null);
                    }
                    else
                    {
                        scope.Context.CintRun.Add(new CintRun { RunId = msg.RunNo });
                    }
                    scope.Context.SaveChanges();
                    scope.Complete();
                }
            }
            catch (Exception ex)
            {
                SaveError(id, msg.RunNo, ex.Message);
                throw;
            }
            cintRepository.Create(msg.CintOrder.Select(s => new Model.CintOrder(s)).ToList(), msg.RunNo, id);
        }
    }
}
