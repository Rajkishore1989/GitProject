using System;
using System.Collections.Generic;
using System.Linq;
using Blue.Cosacs.Financial;
using Blue.Cosacs.Financial.Repositories;
using Blue.Cosacs.Financial.Enums;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Controllers;
using TransferMessage = Blue.Cosacs.Messages.Merchandising.Transfer.TransferMessage;
using Blue.Cosacs.Merchandising.Helpers;

namespace Blue.Cosacs.Web.Areas.Financial.Controllers
{
    public class TransferController : HttpHubSubscriberController<TransferMessage>
    {
        private readonly ITransactionRepository transactionRepository;
        private readonly ITransferMessageRepository transferMessageRepository;
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public TransferController(ITransactionRepository transactionRepository, ITransferMessageRepository transferMessageRepository, IMerchandisingHierarchyRepository hierarchyRepository)
        {
            this.transactionRepository = transactionRepository;
            this.transferMessageRepository = transferMessageRepository;
            this.hierarchyRepository = hierarchyRepository;
        }

        protected override void Sink(int id, TransferMessage reviewMessage)
        {
            if (!transferMessageRepository.Exists(id))
            {
                transferMessageRepository.Create(id, reviewMessage);
            }

            var accounts = transferMessageRepository.GetAccounts();

            var transactions = new List<Transaction>();

            var warrantyProvision = hierarchyRepository.ProductFirstYearWarrantyProvision(reviewMessage.Products.Select(p => p.Id).ToList());

            Func<int, decimal, int, string, decimal> calculateAmount = (productId, cost, percentage, type) =>
            {
                var wProvision = (warrantyProvision.ContainsKey(productId) && type == "FYW") ? warrantyProvision[productId] : 1M;

                return (cost * wProvision) * percentage;
            };

            foreach (var product in reviewMessage.Products)
            {
                if (accounts.Count() != 2)
                {
                    throw new Exception(string.Format("Credit and debit accounts for Product ID {0} has not been configured correctly.", product.Id));
                }

                var now = DateTime.Now;

                transactions.AddRange(accounts.Where(a => a.TransactionType == EntryTypes.Credit).Select(x => new Transaction
                {
                    Account = x.SplitDebitByDepartment ? string.Format("{0}{1}", x.Account.Substring(0, 2), product.DepartmentCode.PadLeft(2, '0')) : x.Account,
                    Amount = calculateAmount(product.Id, (decimal)product.Cost, x.Percentage, x.TransactionCode),
                    BranchNo = short.Parse(reviewMessage.WarehouseLocationSalesId),
                    Date = now,
                    MessageId = id,
                    Type = x.TransactionCode,
                    Description = reviewMessage.Description
                }));

                transactions.AddRange(accounts.Where(a => a.TransactionType == EntryTypes.Debit).Select(x => new Transaction
                {
                    Account = x.SplitDebitByDepartment ? string.Format("{0}{1}", x.Account.Substring(0, 2), product.DepartmentCode.PadLeft(2, '0')) : x.Account,
                    Amount = calculateAmount(product.Id, (decimal)product.Cost, x.Percentage, x.TransactionCode),
                    BranchNo = short.Parse(reviewMessage.ReceivingLocationSalesId),
                    Date = now,
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