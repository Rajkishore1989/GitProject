using Blue.Cosacs.Report;
using Blue.Cosacs.Report.Generic;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Blue.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Report.Controllers
{
    public class SecondEffortSolicitationController : DynamicReportController
    {
        private WarrantyLinkRepository warrantyLinkRepository;

        public SecondEffortSolicitationController(IEventStore audit, Blue.Config.Settings settings,
            IClock clock, WarrantyLinkRepository warrantyLinkRepository)
            : base(clock, audit, settings)
        {
            this.warrantyLinkRepository = warrantyLinkRepository;
        }

        public override JsonResult GenericReport(string parameters)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);

            report.Data = AddMissedSalesCommissionColumn(report);

            audit.LogAsync(new
            {
                parameters = par,
                reportData = report.Data
            }, EventType.ReportShow, EventCategory.Report);

            return Json(new { Report = report }, JsonRequestBehavior.AllowGet);
        }

        private List<List<string>> AddMissedSalesCommissionColumn(ReportResult report)
        {
            // Calculate how much the CSR would earn if they sold the lowest priced warranty
            // that matches the item (based on current warranty prices and configuration)

            if (report.Data.Count == 0)
                return new List<List<string>>();

            List<string> branchNameColumn = GetDataColumn("Branch Name", report);
            List<string> productCodeColumn = GetDataColumn("Product Code", report);
            List<string> commissionPercentageColumn = GetDataColumn("commissionPercentage", report);
            List<string> missedWarrantyQuantityColumn = GetDataColumn("Missed Warranty Quantity", report);

            List<decimal> missedSalesCommissionColumn = new List<decimal>();
            for (int i = 0; i < productCodeColumn.Count; i++)
            {
                var search = SearchWarrantyByProduct(productCodeColumn[i], branchNameColumn[i]);

                if (search == null)
                {
                    continue;
                }
                var warrantyWithMinPrice = search.Items
                    .Where(e => e.price.RetailPrice > 0)
                    .OrderBy(e => e.price.RetailPrice)
                    .FirstOrDefault();

                if (warrantyWithMinPrice == null)
                {
                    continue;
                }

                var warrantyPrice = GetCurrentWarrantyPrice(warrantyWithMinPrice);

                var commissionPercentage = decimal.Parse(commissionPercentageColumn[i]);
                var missedWarrantyQuantity = int.Parse(missedWarrantyQuantityColumn[i]);

                missedSalesCommissionColumn.Add((warrantyPrice * (commissionPercentage / 100)) * missedWarrantyQuantity);
            }

            report = RemoveDataColumn("commissionPercentage", report);
            report = AppendDataColumn("Missed Sales Commission", missedSalesCommissionColumn, report);

            return report.Data;
        }

        private decimal GetCurrentWarrantyPrice(WarrantyLinkResult warrantyWithMinPrice)
        {
            if (warrantyWithMinPrice == null || warrantyWithMinPrice.price == null || !warrantyWithMinPrice.price.RetailPrice.HasValue)
            {
                return 0;
            }

            if (HasPromotionPrice(warrantyWithMinPrice))
            {
                return warrantyWithMinPrice.promotion.Price.Value;
            }

            return warrantyWithMinPrice.price.RetailPrice.Value;
        }

        private bool HasPromotionPrice(WarrantyLinkResult war)
        {
            return war.promotion != null && war.promotion.Price.HasValue;
        }

        private WarrantySearchByProductResult SearchWarrantyByProduct(string productCode, string branchName)
        {
            if (IsSearchCached(productCode, branchName))
            {
                return productSearchCache[Tuple.Create(productCode, branchName)];
            }
            else
            {
                var search = warrantyLinkRepository.SearchByProduct(
                    new WarrantySearchByProduct()
                    {
                        Product = productCode,
                        Location = GetBranchNumber(branchName),
                        Date = clock.Now,
                    });

                CacheSearch(productCode, branchName, search);

                return search;
            }
        }

        private Dictionary<Tuple<string, string>, WarrantySearchByProductResult> productSearchCache =
            new Dictionary<Tuple<string, string>, WarrantySearchByProductResult>();

        private bool IsSearchCached(string productCode, string branchName)
        {
            return IsSearchCached(Tuple.Create(productCode, branchName));
        }

        private bool IsSearchCached(Tuple<string, string> cacheKey)
        {
            if (productSearchCache.ContainsKey(cacheKey))
                return true;
            else
                return false;
        }

        private void CacheSearch(string productCode, string branchName, WarrantySearchByProductResult search)
        {
            if (!IsSearchCached(productCode, branchName))
                productSearchCache.Add(Tuple.Create(productCode, branchName), search);
        }

        public override FileResult GenericReportExport(string parameters, string fileName)
        {
            var par = GetQueryParameters(parameters);
            var report = GenericReportLoader.GetReport(par);
            report.Data = AddMissedSalesCommissionColumn(report);

            audit.LogAsync(new
            {
                parameters = par,
                fileName = fileName,
            }, EventType.ReportExport, EventCategory.Report);

            return File(report.Data.ToByteArray(), "text/plain", fileName.ToString());

            //return base.GenericReportExport(parameters, fileName);
        }

        private short GetBranchNumber(string branchName)
        {
            branchName = branchName
                .Split(new char[] { ' ', '-' },
                    StringSplitOptions.RemoveEmptyEntries)[0];

            return short.Parse(branchName);
        }

    }
}