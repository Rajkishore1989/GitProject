namespace Blue.Cosacs.Web.Areas.Financial.Controllers
{
    using Blue.Cosacs.Financial;
    using Blue.Cosacs.Financial.Repositories;
    using Blue.Cosacs.Web.Controllers;
    using System;
    using System.Linq;
    using CintOrderReceiptMessage = Blue.Cosacs.Messages.Merchandising.CintOrderReceipt.CintOrderReceiptMessage;
    using Blue.Cosacs.Merchandising.Helpers;

    public class CintOrderDeliveredController : HttpHubSubscriberController<CintOrderReceiptMessage>
    {
        private readonly ITransactionRepository transactionRepository;
        private readonly ICintOrderReceiptMessageRepository cintOrderReceiptMessageRepository;

        public CintOrderDeliveredController(ITransactionRepository transactionRepository, ICintOrderReceiptMessageRepository cintOrderReceiptMessageRepository)
        {
            this.transactionRepository = transactionRepository;
            this.cintOrderReceiptMessageRepository = cintOrderReceiptMessageRepository;
        }

        protected override void Sink(int id, CintOrderReceiptMessage reviewMessage)
        {
            if (!cintOrderReceiptMessageRepository.Exists(id))
            {
                cintOrderReceiptMessageRepository.Create(id, reviewMessage);
            }

            var accounts = cintOrderReceiptMessageRepository.GetDeliveredAccounts();

            var transactions = accounts.Select(x => new Transaction
            {
                Account = x.SplitDebitByDepartment ? string.Format("{0}{1}", x.Account.Substring(0, 2), reviewMessage.DepartmentCode.PadLeft(2, '0')) : x.Account,
                Amount = (decimal?)reviewMessage.TotalAWC * x.Percentage * (x.TransactionDescription == "FYW Provisioning" ? reviewMessage.FirstYearWarranty.GetValueOrDefault(1) : 1),
                BranchNo = 
                (
                    x.TransactionCode == "FYW" ? short.Parse(reviewMessage.SaleLocationId) : 
                    x.TransactionType == "Credit" ? short.Parse(reviewMessage.StockLocationId) : 
                    short.Parse(reviewMessage.SaleLocationId)
                ),
                Date = DateTime.Now,
                MessageId = id,
                Type = x.TransactionCode,
                Description = reviewMessage.Description
            }).ToList();

            if (transactions.Sum(t => t.Amount) != 0)
            {
                throw new Exception("Financial transaction is not balanced. Check that the transaction type percentages are configured correctly.");
            }

            transactionRepository.Create(transactions);
        }
    }
}