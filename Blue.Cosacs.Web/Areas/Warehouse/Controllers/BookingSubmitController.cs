namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    using Blue.Cosacs.Messages.Warehouse;
    using Blue.Cosacs.Warehouse.Repositories;
    using Blue.Cosacs.Web.Controllers;

    public class BookingSubmitController : HttpHubSubscriberController<BookingSubmit>
    {
        private readonly BookingRepository bookingRepository;

        public BookingSubmitController(BookingRepository bookingRepository)
        {
            this.bookingRepository = bookingRepository;
        }

        protected override void Sink(int id, BookingSubmit message)
        {
            bookingRepository.AddBooking(message);
        }
    }
}