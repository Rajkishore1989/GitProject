namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net.Mime;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Report;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class PromotionReportController : Controller
    {
        private readonly IPromotionReportRepository promotionsReportRepository;

        private readonly ILocationRepository locationRepository;

        private readonly IPromotionRepository promotionRepository;

        public PromotionReportController(IPromotionReportRepository promotionsReportRepository, ILocationRepository locationRepository, IPromotionRepository promotionRepository)
        {
            this.promotionsReportRepository = promotionsReportRepository;
            this.locationRepository = locationRepository;
            this.promotionRepository = promotionRepository;
        }

        [Permission(ReportPermissionEnum.Promotions)]
        public ActionResult Index()
        {
            return View();
        }

        [Permission(ReportPermissionEnum.Promotions)]
        public ViewResult Print(PromotionReportSearchModel search)
        {
            return View(promotionsReportRepository.PromotionReportPrint(search) );
        }

        [Permission(ReportPermissionEnum.Promotions)]
        public JsonResult Search(PromotionReportSearchModel query, int pageSize, int pageNumber)
        {
            int pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var result = promotionsReportRepository.PromotionReport(query, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(ReportPermissionEnum.Promotions)]
        public JsonResult GetNames()
        {
            return new JSendResult(JSendStatus.Success, promotionRepository.GetPromotionNames().Select(p => new { Name = p.Key, Id = p.Value }));
        }

        [Permission(ReportPermissionEnum.Promotions)]
        public FileResult Export(PromotionReportSearchModel search)
        {
            var result = promotionsReportRepository.PromotionReport(search);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);

            WriteColumnHeaders(writer);

            foreach (var row in result.Page)
            {
                WritePromotions(writer, row);
            }

            writer.Flush();
            stream.Seek(0, SeekOrigin.Begin);
            return File(stream, MediaTypeNames.Application.Octet, string.Format("PromotionReport({0}).csv", DateTime.Now.Ticks));
        }

        private void WriteColumnHeaders(StreamWriter writer)
        {
            writer.Write("Location,");
            writer.Write("SKU,");
            writer.Write("Item Description,");
            writer.Write("Quantity Sold,");
            writer.Write("AWC,");
            writer.Write("Promotion,");
            writer.Write("Promotional Cash Price,");
            writer.Write("Total Promo Cash Value,");
            writer.Write("Promotional Margin,");
            writer.Write("Total Promo Margin Value,");
            writer.Write("Cash Price,");
            writer.Write("Cash Margin");
        }

        private void WritePromotions(StreamWriter writer, PromotionReportViewModel row)
        {
            writer.Write("\n");
            writer.Write(row.LocationName + ",");
            writer.Write(row.Sku + ",");
            writer.Write(row.LongDescription + ",");
            writer.Write(row.Quantity + ",");
            writer.Write(row.AverageWeightedCost + ",");
            writer.Write(row.PromotionName + ",");
            writer.Write(row.Price + ",");
            writer.Write(row.NetTotal + ",");
            writer.Write(row.PromotionalMargin + ",");
            writer.Write(row.PromotionalTotal + ",");
            writer.Write(row.CashPrice + ",");
            writer.Write(row.CashMargin);
        }
    }
}