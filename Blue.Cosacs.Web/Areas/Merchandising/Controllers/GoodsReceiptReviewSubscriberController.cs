namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Net;
    using System.Net.Mail;

    using Blue.Config;
    using Blue.Cosacs.Messages.Merchandising.GoodsReceiptEmail;
    using Blue.Cosacs.Web.Controllers;
    using System.Text;
    public class GoodsReceiptReviewSubscriberController : HttpHubSubscriberController<GoodsReceiptReview>
    {
        private readonly Settings settings;

        public GoodsReceiptReviewSubscriberController(Settings settings)
        {
            this.settings = settings;
        }

        protected override void Sink(int id, GoodsReceiptReview reviewMessage)
        {
            if (!string.IsNullOrEmpty(reviewMessage.FinanceEmailAddress))
            {
                var title = string.Format("Goods receipt #{0} awaiting review", reviewMessage.GoodsReceiptId);
                StringBuilder productURLs = new StringBuilder();
                foreach (var url in reviewMessage.ProductURLs)
                {
                    productURLs.AppendLine(url);
                }

                var mailMessage = new MailMessage
                                      {
                                          From = new MailAddress(settings.GlobalNotificationSystemAccount, "blue.hub"), 
                                          Subject = title, 
                                          Body =
                                              string.Format(
                                                  "Dear Finance Team\n\n" +
                                                  "Goods Receipt #{0} has {1} item{2} with prices that need to be reviewed.\n\n" +
                                                  "Please review here:\n\n " +
                                                  "{3}\n\n" +
                                                  "\n\n" +
                                                  "Links to products for updating costings \n" +
                                                  productURLs.ToString() + "\n" +
                                                  "Regards\n\n" + 
                                                  "CoSACS Team\n\n IMPORTANT: This is an automatically generated message - Do not reply to this email.", 
                                                  reviewMessage.GoodsReceiptId, 
                                                  reviewMessage.NumberOfItemsToReview, 
                                                  reviewMessage.NumberOfItemsToReview > 1 ? "s" : string.Empty, 
                                                  reviewMessage.AbsoluteReviewUrl)
                                      };

                mailMessage.To.Add(new MailAddress(reviewMessage.FinanceEmailAddress, "Finance Team"));

                // Send email
                var mailClient = new SmtpClient
                                     {
                                         Host = this.settings.EmailSMTP, 
                                         Port = this.settings.EmailPort, 
                                         UseDefaultCredentials = false, 
                                         Credentials = new NetworkCredential(this.settings.EmailUser, this.settings.EmailPassword), 
                                         EnableSsl = this.settings.EmailSSL, 
                                         DeliveryMethod = SmtpDeliveryMethod.Network, 
                                         Timeout = 120000
                                     };

                mailClient.Send(mailMessage);
            }
        }
    }
}