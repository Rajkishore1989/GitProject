namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Messages.Merchandising.Vendors;
    using Blue.Cosacs.Web.Controllers;
    using Blue.Hub.Client;

    public class VendorsSubscriberController : HttpHubSubscriberController<VendorInfoSending>
    {
        private readonly IPublisher publisher;

        public VendorsSubscriberController(IPublisher publisher)
        {
            this.publisher = publisher;
        }

        protected override void Sink(int id, VendorInfoSending msg)
        {
            var count = msg.VendorRecordHeader.Count();

            if (count != msg.SummarySection.TotalRecords)
            {
                var error = string.Format(
                    "The total number of vendors does not match number specified in the summary. Count is {0} and summary specifies {1}", 
                    count, 
                    msg.SummarySection.TotalRecords);
                throw new MessageValidationException(error, null);
            }

            foreach (var vendor in msg.VendorRecordHeader)
            {
                this.publisher.Publish<Context, VendorRecordHeader>("Merchandising.Vendor", vendor);
            }
        }
    }
}