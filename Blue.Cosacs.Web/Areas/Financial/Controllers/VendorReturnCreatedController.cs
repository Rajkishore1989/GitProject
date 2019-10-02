namespace Blue.Cosacs.Web.Areas.Financial.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Blue.Cosacs.Financial;
    using Blue.Cosacs.Financial.Enums;
    using Blue.Cosacs.Financial.Repositories;
    using Blue.Cosacs.Web.Controllers;
    using Blue.Hub.Client;
    using VendorReturnMessage = Blue.Cosacs.Messages.Merchandising.VendorReturn.VendorReturnMessage;
    using Blue.Cosacs.Merchandising.Helpers;

    public class VendorReturnCreatedController : HttpHubSubscriberController<VendorReturnMessage>
    {
        private readonly ITransactionRepository transactionRepository;
        private readonly IVendorReturnMessageRepository vendorReturnMessageRepository;

        public VendorReturnCreatedController(ITransactionRepository transactionRepository, IVendorReturnMessageRepository vendorReturnMessageRepository)
        {
            this.transactionRepository = transactionRepository;
            this.vendorReturnMessageRepository = vendorReturnMessageRepository;
        }

        protected override void Sink(int id, VendorReturnMessage reviewMessage)
        {
            if (!vendorReturnMessageRepository.Exists(id))
            {
                vendorReturnMessageRepository.Create(id, reviewMessage);
            }

            var departments = vendorReturnMessageRepository.GetDepartments();

            var transactions = new List<Transaction>();

            foreach (var product in reviewMessage.Products)
            {
                var accounts = departments.AsQueryable();
                if (product.Type == "SparePart")
                {
                    accounts = accounts.Where(x => x.ProductType == product.Type)
                                       .Where(x => x.TransactionDescription == TransactionTypes.VendorReturnParts);
                }
                else if (reviewMessage.VendorType == "Local")
                {
                    accounts = accounts.Where(x => x.VendorType == reviewMessage.VendorType)
                                       .Where(x => x.TransactionDescription == TransactionTypes.VendorReturnLocal);
                }
                else if (reviewMessage.VendorType == "International" || reviewMessage.VendorType == "CARICOM")
                {
                    accounts = accounts.Where(x => x.VendorType == "International")
                                       .Where(x => x.TransactionDescription == TransactionTypes.VendorReturnForeign);
                }
                else
                {
                    throw new MessageValidationException(string.Format("Unable to create transaction for Vendor Return Product Id {0}. The message does not specify 'Parts', 'Local' or 'International'.", product.Id), null);
                }

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