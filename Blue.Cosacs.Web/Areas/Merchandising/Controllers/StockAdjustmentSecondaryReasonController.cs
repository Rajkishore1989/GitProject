namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockAdjustmentSecondaryReasonController : Controller
    {
        private readonly IStockAdjustmentReasonRepository stockAdjustmentReasonRepository;

        public StockAdjustmentSecondaryReasonController(IStockAdjustmentReasonRepository stockAdjustmentReasonRepository)
        {
            this.stockAdjustmentReasonRepository = stockAdjustmentReasonRepository;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsEdit)]
        public JsonResult Create(StockAdjustmentSecondaryReasonViewModel model)
        {
            if (model.PrimaryReasonId.HasValue && !stockAdjustmentReasonRepository.SecondaryReasonIsUnqiue(model.PrimaryReasonId.Value, model.SecondaryReason))
            {
                ModelState.AddModelError("SecondaryReason", "Secondary reason must be unique");
            }
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            var result = stockAdjustmentReasonRepository.AddSecondaryReason(model.PrimaryReasonId.Value, model);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsEdit)]
        public JsonResult Update(StockAdjustmentSecondaryReasonViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            var result = stockAdjustmentReasonRepository.UpdateSecondaryReasonViewModel(model);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsEdit)]
        public JsonResult Delete(int id)
        {
            stockAdjustmentReasonRepository.RemoveSecondaryReason(id);
            return new JSendResult(JSendStatus.Success);
        }

        public JsonResult SetDefault(int id)
        {
            stockAdjustmentReasonRepository.SetDefaultSecondaryReason(id);
            return new JSendResult(JSendStatus.Success);
        }
    }
}