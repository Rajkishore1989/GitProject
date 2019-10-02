namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Net.Mail;
    using Blue.Cosacs.Merchandising.Helpers;

    using System.Net;

    using Blue.Cosacs.Merchandising.Repositories;

    public class VendorMailSubscriberController : Web.Controllers.HttpHubSubscriberController<Messages.Merchandising.PurchaseOrder.VendorPurchaseOrder>
    {
        private readonly IPurchaseRepository purchaseRepository;

        private readonly ISupplierRepository supplierRepository;

        private readonly ILocationRepository locationRepository;

        private readonly Blue.Config.Settings settings;

        public VendorMailSubscriberController(IPurchaseRepository purchaseRepository, ISupplierRepository supplierRepository, ILocationRepository locationRepository, Blue.Config.Settings settings)
        {
            this.purchaseRepository = purchaseRepository;
            this.supplierRepository = supplierRepository;
            this.locationRepository = locationRepository;
            this.settings = settings;
        }

        protected override void Sink(int id, Messages.Merchandising.PurchaseOrder.VendorPurchaseOrder purchaseMessage)
        {
            // Load the purchase order from the message details
            var purchaseOrder = purchaseRepository.Get(purchaseMessage.PurchaseOrderId);
            if (purchaseOrder == null)
            {
                throw new Exception("Purchase order with Id '" + purchaseMessage.PurchaseOrderId + "' not found.");
            }

            var supplier = supplierRepository.Get(purchaseOrder.VendorId);
            var location = locationRepository.Get(purchaseOrder.ReceivingLocationId);
            
            if (!string.IsNullOrEmpty(purchaseMessage.VendorEmail))
            {
                // Create email with PDF attachments
                var title = string.Format("Order-{0}.pdf", purchaseOrder.Id);
                var mailMessage = new MailMessage()
                {
                    From = new MailAddress(settings.GlobalNotificationSystemAccount, "Unicomer"),
                    Subject = title,
                    Body = string.Format(
                        @"Purchase order for order #{0} is attached. 
                        This is an electronic generated mail, please do not reply as this mailbox is not monitored and you will not receive a response. 
                        In the event that your company is unable to meet the requirements of this Purchase Order, 
                        please contact our Commercial Department within 24 hours receipt of this email.", 
                        purchaseOrder.Id)
                };
                mailMessage.To.Add(new MailAddress(purchaseMessage.VendorEmail, purchaseMessage.VendorName));
                
                // Create attachments
                var attachmentStream = PdfHelper.CreatePdfMemoryStream(purchaseOrder, supplier, location);
                attachmentStream.Seek(0, SeekOrigin.Begin);
                var attachment = new Attachment(attachmentStream, title);
                mailMessage.Attachments.Add(attachment);

                // Send email
                
                var mailClient = new SmtpClient 
                {
                    Host = settings.EmailSMTP,
                    Port = settings.EmailPort,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(settings.EmailUser, settings.EmailPassword),
                    EnableSsl = settings.EmailSSL,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 120000
                };

                mailClient.Send(mailMessage);
            }
        }
    }
}
