namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    using Blue.Cosacs.Messages.Warehouse;
    using Blue.Cosacs.Warehouse.Repositories;
    using Blue.Cosacs.Web.Controllers;

    public class BookingsCancelController : HttpHubSubscriberController<BookingCancel>
    {
        private readonly BookingRepository bookingRepository;

        public BookingsCancelController(BookingRepository bookingRepository)
        {
            this.bookingRepository = bookingRepository;
        }

        protected override void Sink(int id, BookingCancel message)
        {
            bookingRepository.CancelBooking(message);
        }
    }
}