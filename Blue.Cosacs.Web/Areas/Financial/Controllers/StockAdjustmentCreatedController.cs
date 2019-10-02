namespace Blue.Cosacs.Web.Areas.Financial.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Blue.Cosacs.Financial;
    using Blue.Cosacs.Financial.Repositories;
    using Blue.Cosacs.Web.Controllers;
    using StockAdjustmentMessage = Blue.Cosacs.Messages.Merchandising.StockAdjustment.StockAdjustmentMessage;
    using Blue.Cosacs.Merchandising.Helpers;

    public class StockAdjustmentCreatedController : HttpHubSubscriberController<StockAdjustmentMessage>
    {
        private readonly ITransactionRepository transactionRepository;
        private readonly IStockAdjustmentMessageRepository stockAdjustmentMessageRepository;

        public StockAdjustmentCreatedController(ITransactionRepository transactionRepository, IStockAdjustmentMessageRepository stockAdjustmentMessageRepository)
        {
            this.transactionRepository = transactionRepository;
            this.stockAdjustmentMessageRepository = stockAdjustmentMessageRepository;
        }

        protected override void Sink(int id, StockAdjustmentMessage reviewMessage)
        {
            if (!stockAdjustmentMessageRepository.Exists(id))
            {
                stockAdjustmentMessageRepository.Create(id, reviewMessage);
            }

            var accounts = stockAdjustmentMessageRepository.GetAccounts();

            var transactions = new List<Transaction>();

            foreach (var product in reviewMessage.Products)
            {
                accounts = accounts
                    .Where(d => d.AdjustmentType == reviewMessage.SecondaryReason)
                    .ToList();

                if (accounts.Count() != 2)
                {
                    throw new Exception(string.Format("Credit and debit accounts for Product ID {0} has not been configured correctly.", product.Id));
                }

                transactions.AddRange(accounts.Select(x => new Transaction
                {
                    Account = x.SplitDebitByDepartment ? string.Format("{0}{1}", x.Account.Substring(0, 2), product.DepartmentCode.PadLeft(2, '0')) : x.Account,
                    Amount = (decimal?)product.Cost * x.Percentage,
                    BranchNo = short.Parse(reviewMessage.SalesLocationId),
                    Date = DateTime.Now,
                    MessageId = id,
                    Type = x.TransactionCode,
                    Description = reviewMessage.Description
                }));
            }

            if (transactions.Sum(t => t.Amount) != 0)
            {
                throw new Exception("Financial transaction is not balanced. Check that the transaction type percentages are configured correctly.");
            }

            transactionRepository.Create(transactions);
        }
    }
}