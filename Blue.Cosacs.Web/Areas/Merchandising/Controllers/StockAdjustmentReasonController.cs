namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class StockAdjustmentReasonController : Controller
    {
        private readonly IStockAdjustmentReasonRepository repo;

        public StockAdjustmentReasonController(IStockAdjustmentReasonRepository repo)
        {
            this.repo = repo;
        }

        public ViewResult Index()
        {
            return View(repo.Get());
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsView)]
        public JsonResult Get()
        {
            return new JSendResult(JSendStatus.Success, repo.Get());
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsEdit)]
        public JsonResult Create(StockAdjustmentReasonCreateModel model)
        {
            if (!repo.PrimaryReasonIsUnqiue(model.PrimaryReason))
            {
                ModelState.AddModelError("PrimaryReason", "Primary reason must be unique");
            }
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            var result = repo.Create(model);
            return new JSendResult(JSendStatus.Success, result);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.StockAdjustmentReasonsEdit)]
        public JsonResult Delete(int id)
        {
            if (repo.PrimaryReasonContainsDefaultSecondaryReason(id))
            {
                return new JSendResult(JSendStatus.BadRequest, new { id }, "Unable to delete primary reason. It contains the default secondary reason.");
            }
            repo.DeletePrimaryReason(id);
            return new JSendResult(JSendStatus.Success);
        }
    }
}