namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using System;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockCountScheduleController : Controller
    {
        private readonly IStockCountRepository stockCountRepository;

        public StockCountScheduleController(IStockCountRepository stockCountRepository)
        {
            this.stockCountRepository = stockCountRepository;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountSchedule)]
        public ViewResult New()
        {
            return View();
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountSchedule)]
        public JsonResult Create(StockCountCreateModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            stockCountRepository.Create(model, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success);
        }

         [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountSchedule)]
        public JsonResult Exists(int locationId, DateTime countDate)
        {
            var existingSchedule = stockCountRepository.GetSchedule(locationId, countDate);
            if (existingSchedule != null)
            {
                return new JSendResult(JSendStatus.BadRequest, new { existingSchedule }, "A stock count is already scheduled for that date and location.");
            }
            return new JSendResult(JSendStatus.Success);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountSchedule)]
        public JsonResult Delete(int id)
        {
            stockCountRepository.Cancel(id, HttpContext.GetUser().Id);
            return new JSendResult(JSendStatus.Success);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockCountView)]
        public JsonResult Preview(StockCountCreateModel model, int pageSize, int pageNumber)
        {
            if (model.LocationId == null && model.Fascia == null)
            {
                return new JSendResult(JSendStatus.BadRequest, "Please specify a location to preview.");
            }
            var pageIndex = pageNumber > 0 ? pageNumber - 1 : 0;
            return new JSendResult(JSendStatus.Success, stockCountRepository.Preview(model, pageSize, pageIndex));
        }
    }
}