using System.Web.Mvc;
using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Merchandising.Repositories;
using Blue.Cosacs.Web.Common;
using System.Text;
using System.Collections.Generic;
using System.Linq;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Net;
    using System.Security;

    using Blue.Config.Repositories;
    using Blue.Glaucous.Client.Mvc;
   
    using Settings = Blue.Cosacs.Merchandising.Settings;

    public class ExportController : Controller
    {
        private readonly IExportRepository export;

        private readonly Settings settings;

        private readonly ISettings settingsRepo;

        public ExportController(IExportRepository export, Settings settings, ISettings settingsRepo)
        {
            this.export = export;
            this.settings = settings;
            this.settingsRepo = settingsRepo;
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        [CronJob]
        [LongRunningQueries]
        public void Export()
        {
            ExportToDirectory(
                (directory) =>
                    {
                        BaseImportFile<PurchaseOrderExportModel>.WriteToFile(
                            export.ExportOrders().ToList(),
                            string.Format("{0}\\" + "BMSFPORD.DAT", directory.FullName));
                        BaseImportFile<ProductExportModel>.WriteToFile(
                            export.ExportProducts().ToList(),
                            string.Format("{0}\\" + "BMSFCPRD.DAT", directory.FullName));
                        BaseImportFile<SetExportModel>.WriteToFile(
                            export.ExportSets().ToList(),
                            string.Format("{0}\\" + "BMSFCKIT.DAT", directory.FullName));
                        BaseImportFile<StockLevelExportModel>.WriteToFile(
                            export.ExportStockLevels().ToList(),
                            string.Format("{0}\\" + "BMSFPSTK.DAT", directory.FullName));
                        BaseImportFile<PromoExportViewModel>.WriteToFile(
                            export.ExportPromotions().ToList(),
                            string.Format("{0}\\" + "BMSFCPRM.DAT", directory.FullName));
                        BaseImportFile<AssociatedProductExportModel>.WriteToFile(
                            export.ExportAssociatedProducts().ToList(),
                            string.Format("{0}\\" + "BMSFAPRD.DAT", directory.FullName));
                    });
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        [CronJob]
        [LongRunningQueries]
        public void ExportHyperion()
        {
            ExportToDirectory(
                (directory) =>
                    {
                        BaseImportFile<HyperionExportModel>.WriteToFile(
                            export.ExportToHyperion().ToList(),
                            string.Format("{0}\\" + "t_src_inventario.txt", directory.FullName),
                            true);
                    });
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        [CronJob]
        [LongRunningQueries]
        public void ExportAbbreviatedStock()
        {
            ExportToDirectory(
                (directory) => BaseImportFile<AbbreviatedStockExportModel>.WriteToFile(
                    this.export.ExportAbbreviatedStock().ToList(),
                    string.Format("{0}\\" + "AbbreviatedStock.csv", directory.FullName),
                    false));
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        [CronJob]
        [LongRunningQueries]
        public void ExportMagento()
        {
            ExportToDirectory(
                (directory) =>
                    {
                        var nextRunNo = HiLo.Cache("ExportRunNo").NextId().ToString();
                        var runNo = nextRunNo.PadLeft(3, '0').Substring(Math.Max(nextRunNo.Length - 3, 0), 3);

                        BaseImportFile<MagentoExportEligbleModel>.WriteToFile(
                            export.ExportMagentoEligible().ToList(),
                            string.Format("{0}\\" + "{1}ecom{2}.csv", directory.FullName, settingsRepo.Get("ISOCountryCode"), runNo),
                            true);
                        BaseImportFile<MagentoExportIneligibleModel>.WriteToFile(
                            export.ExportMagentoIneligible().ToList(),
                            string.Format("{0}\\" + "IneligibleOnlineProducts{1}.csv", directory.FullName, runNo),
                            true);
                    });
        }

        private void ExportToDirectory(Action<DirectoryInfo> exportAction)
        {
            var directoryPath = settings.FileExportDirectory;

            if (string.IsNullOrWhiteSpace(directoryPath))
            {
                throw new Exception(string.Format("Export directory has not been configured"));
            }

            DirectoryInfo directory;
            try
            {
                directory = new DirectoryInfo(directoryPath);

                if (!directory.Exists)
                {
                    directory.Create();
                }
            }
            catch (SecurityException ex)
            {
                throw new Exception(string.Format("Invalid permissions on export directory\n{0}", ex.Message));
            }
            catch (Exception ex)
            {
                throw new Exception(string.Format("Export directory is invalid\n{0}", ex.Message));
            }

            exportAction(directory);
        }
    }
}