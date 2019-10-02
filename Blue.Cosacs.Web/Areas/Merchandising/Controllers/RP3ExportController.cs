using System;
using System.Linq;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Net;
    using System.Threading.Tasks;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models.RP3Export;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class RP3ExportController : Controller
    {
        private readonly IRP3ExportRepository repository;

        private readonly Settings settings;

        public RP3ExportController(IRP3ExportRepository repository, Settings settings)
        {
            this.repository = repository;
            this.settings = settings;
        }

        [CronJob]
        [LongRunningQueries]
        public void Export()
        {
            const string BatchFileName = "SendFilesInterface.bat";
            var path = Path.Combine(this.settings.RP3SendFilesInterfaceDirectory, BatchFileName);
            var file = new FileInfo(path);

            this.GenerateFiles();

            if (!file.Exists || string.IsNullOrWhiteSpace(this.settings.RP3SendFilesInterfaceDirectory))
            {
                throw new FileNotFoundException("Could not find batch file", file.FullName);
            }

            var proc = new Process
            {
                StartInfo =
                {
                    FileName = Path.Combine(this.settings.RP3SendFilesInterfaceDirectory, BatchFileName),
                    WorkingDirectory = this.settings.RP3SendFilesInterfaceDirectory,
                    CreateNoWindow = false,
                    UseShellExecute = false
                }
            };
            proc.Start();
        }

        private async Task ExecuteAsync(Action toExecute) 
        {
            await Task.Run(toExecute).ConfigureAwait(false);
        }

        private void GenerateFiles()
        {
            var transactionsFromDate = DateTime.Now.Date.AddDays((this.settings.RP3ExportLastXDaysOfTransactions - 1) * -1).ToUniversalTime().Date;
            var rp3GoLiveDate = this.settings.RP3GoLiveDate.ToUniversalTime();

            this.ExportToDirectory(
                directory =>
                    {
                        var result = new List<Task>();

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<LocationExportModel>.WriteToFile(
                                this.repository.GetLocations(),
                                string.Format("{0}\\" + this.GetFileName("Locations"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<ProductExportModel>.WriteToFile(
                                this.repository.GetProducts(),
                                string.Format("{0}\\" + this.GetFileName("Product"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<PurchaseOrderProductExportModel>.WriteToFile(
                                this.repository.GetPurchaseOrderDetail(transactionsFromDate),
                                string.Format("{0}\\" + this.GetFileName("PurchaseOrderDetail"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                        BaseImportFile<PurchaseOrderExportModel>.WriteToFile(
                            this.repository.GetPurchaseOrders(transactionsFromDate),
                            string.Format("{0}\\" + this.GetFileName("PurchaseOrderHeader"), directory.FullName),
                            true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<VendorReturnExportModel>.WriteToFile(
                                this.repository.GetVendorReturns(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("PurchaseReturnsHeader"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<VendorReturnProductExportModel>.WriteToFile(
                                this.repository.GetVendorReturnProducts(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("PurchaseReturnsDetail"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<GoodsReceiptExportModel>.WriteToFile(
                                this.repository.GetGoodsReceipts(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("POReceptionsHeader"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<GoodsReceiptProductExportModel>.WriteToFile(
                                this.repository.GetGoodsReceiptProducts(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("POReceptionsDetail"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<StockAdjustmentExportModel>.WriteToFile(
                                this.repository.GetStockAdjustments(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("AdjustmentHeader"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<StockAdjustmentProductExportModel>.WriteToFile(
                                this.repository.GetStockAdjustmentProducts(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("AdjustmentDetail"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<StockTransferExportModel>.WriteToFile(
                                this.repository.GetStockTransfers(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("TransferHeader"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<StockTransferProductExportModel>.WriteToFile(
                                this.repository.GetStockTransferProducts(transactionsFromDate, rp3GoLiveDate),
                                string.Format("{0}\\" + this.GetFileName("TransferDetail"), directory.FullName),
                                true)));

                        result.Add(ExecuteAsync(() => 
                            BaseImportFile<WeeklyMerchandisingReportExportModel>.WriteToFile(
                                this.repository.GetWeeklyMerchandisingReport(),
                                string.Format("{0}\\" + this.GetFileName("WeeklyMerchandiseReport"), directory.FullName),
                                true)));

                        return result;
                    });
        }

        public string GetFileName(string name)
        {
            var fileName = string.Format("MER{0}{1}", name, DateTime.Now.ToString("yyMMdd"));

            return string.Format("{0}{1}.txt", fileName, this.GetIncrementCount(fileName).ToString("00"));
        }

        private int GetIncrementCount(string name)
        {
            var dir = new DirectoryInfo(this.settings.RP3FileExportDirectory);
            var existingFiles = dir.GetFiles(name + "??.txt", SearchOption.TopDirectoryOnly).Select(
                f =>
                    {
                        var fileName = Path.GetFileNameWithoutExtension(f.Name);
                        var number = int.Parse(fileName.Substring(fileName.Length - 2, 2));

                        return number;
                    }).ToList();

            var nextCount = ((existingFiles.Any() ? existingFiles.Max() : 0) + 1) % 99;
            return nextCount;
        }

        private void ExportToDirectory(Func<DirectoryInfo, IList<Task>> exportAction)
        {
            var directoryPath = this.settings.RP3FileExportDirectory;

            if (string.IsNullOrWhiteSpace(directoryPath))
            {
                throw new ArgumentNullException(string.Format("Export directory has not been configured"));
            }

            var directory = new DirectoryInfo(directoryPath);

            if (!directory.Exists)
            {
                directory.Create();
            }

            var tasks = exportAction(directory);

            Task.WaitAll(tasks.ToArray());
        }
    }
}