namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Messages.Merchandising.BookingMessage;
    using Blue.Cosacs.Web.Controllers;
    using Blue.Hub.Client;

    public class BookingReceiveStockController : HttpHubSubscriberController<BookingMessage>
    {
        private readonly IStockAllocationRepository allocationRepository;
        private readonly IStockRequisitionRepository requisitionRepository;
        private readonly IStockTransferRepository transferRepository;

        public BookingReceiveStockController(IStockAllocationRepository allocationRepository, IStockRequisitionRepository requisitionRepository, IStockTransferRepository transferRepository)
        {
            this.allocationRepository = allocationRepository;
            this.requisitionRepository = requisitionRepository;
            this.transferRepository = transferRepository;
        }

        protected override void Sink(int id, BookingMessage message)
        {
            switch (message.Type)
            {
                case BookingTypes.Allocation:
                    allocationRepository.Receive(message);
                    break;
                case BookingTypes.Requisition:
                    requisitionRepository.Receive(message);
                    break;
                case BookingTypes.Transfer:
                    transferRepository.Receive(message);
                    break;
                default:
                    throw new MessageValidationException("Invalid booking type", null);
            }
        }
    }
}