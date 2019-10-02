namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Web.Mvc;
    using System.Web.Script.Serialization;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;
    using System.Text;

    public class StockCountController : Controller
    {
        private readonly IStockCountRepository stockCountRepository;

        public StockCountController(IStockCountRepository stockCountRepository)
        {
            this.stockCountRepository = stockCountRepository;
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public ActionResult Index()
        {
            var model = stockCountRepository.Search(new StockCountSearchQueryModel(), 10, 0);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public ViewResult Detail(int id)
        {
            return View(stockCountRepository.Get(id));
        }

        [Permission(MerchandisingPermissionEnum.StockCountEdit)]
        public JsonResult SaveAll(List<StockCountProductUpdateModel> model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            stockCountRepository.Update(model, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success);
        }

        [Permission(MerchandisingPermissionEnum.StockCountClose)]
        public JsonResult Close(int id)
        {
            var model = stockCountRepository.Close(id, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success, model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountClose)]
        public JsonResult Cancel(int id)
        {
            var model = stockCountRepository.Cancel(id, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success, model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public ViewResult Print(int id)
        {
            var model = stockCountRepository.PrintStockCount(id);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public ViewResult PrintVariance(int id)
        {
            var model = stockCountRepository.PrintVariance(id);
            return View(model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public ActionResult Search(StockCountSearchQueryModel param, int pageSize, int pageNumber)
        {
            var model = stockCountRepository.Search(param, pageSize, pageNumber > 0 ? pageNumber - 1 : 0);
            return new JSendResult(JSendStatus.Success, model);
        }

        [HttpGet]
        [CronJob]
        [LongRunningQueries]
        [Permission(MerchandisingPermissionEnum.RunScheduledJobs)]
        public HttpStatusCodeResult AutoClose()
        {
            stockCountRepository.AutoClose(HttpContext.GetUser().Id);
            return new HttpStatusCodeResult((int)HttpStatusCode.OK);
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public FileResult Export(int id)
        {
            const string FileHeader =
                "Sku, Description, RecordedStockOnHand, Count, SystemAdjustments, Variance, Comments";

            var file = FileHeader + "\r" + BaseImportFile<StockCountProductExportModel>.WriteToString(stockCountRepository.Export(id));

            var fileName = string.Concat("StockCount#", id, ".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
        }

        [Permission(MerchandisingPermissionEnum.StockCountView)]
        public JsonResult ProductSearch(int id, int? productId, int pageSize, int pageNumber)
        {
            var pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            var model = stockCountRepository.ProductSearch(id, productId, pageSize, pageIndex);
            return new JSendResult(JSendStatus.Success, model);
        }

        [Permission(MerchandisingPermissionEnum.StockCountEdit)]
        public ActionResult SyncCounts(string model)
        {
            if (model != null && model != "[]")
            {
                model = Uri.UnescapeDataString(model);
                this.stockCountRepository.Update(
                    new JavaScriptSerializer().Deserialize<List<SimpleStockCountProductViewModel>>(model), 
                    this.HttpContext.GetUser().Id);               
            }

            return new JSendResult(JSendStatus.Success, stockCountRepository.Get());
        }
    }
}