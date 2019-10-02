using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Blue.Config;
using Blue.Cosacs.Warranty.Model;
using Blue.Cosacs.Warranty.Repositories;
using Filter = Blue.Cosacs.Warranty.Promotions.Filter;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantyPromotionsController : Controller
    {
        private readonly HierarchyController hierarchyController;
        private readonly WarrantyPromotionRepository warrantyPromotionsRepository;
        private readonly IClock clock;

        public WarrantyPromotionsController(WarrantyPromotionRepository warrantyPromotionsRepository, HierarchyController hierarchyController, IClock clock)
        {
            this.warrantyPromotionsRepository = warrantyPromotionsRepository;
            this.hierarchyController = hierarchyController;
            this.clock = clock;
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        public ActionResult Index()
        {
            ViewBag.viewWarrantyPermission = this.GetUser().HasPermission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView);
            ViewBag.editPricePermission = this.GetUser().HasPermission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsEdit);

            return View("Index");
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        public ActionResult Get(int id)
        {
            ViewBag.viewWarrantyPermission = this.GetUser().HasPermission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView);
            ViewBag.editPricePermission = this.GetUser().HasPermission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsEdit);

            return View("Index", model: new
            {
                filters = new
                {
                    hierarchyData = hierarchyController.GetHierarchyData().Data,
                    branches = new Web.Common.BranchPickListProvider().Load().ToDictionary(r => r.k, r => r.v),
                    branchTypes = new Web.Common.SetsPickListProvider("fascia").Load().ToDictionary(r => r.k, r => r.v)
                },
                promotions = warrantyPromotionsRepository.GetPromotions(new Filter
                {
                    Id = id
                })
            }.ToJson());
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        public ActionResult List(Filter filterValues)
        {
            return Json(warrantyPromotionsRepository.GetPromotions(filterValues), JsonRequestBehavior.AllowGet);
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsEdit)]
        [HttpPost]
        public ActionResult Create(WarrantyPromotionSettings promotion)
        {
            try
            {
                var promo = warrantyPromotionsRepository.Save(promotion);
                return Json(new
                {
                    Result = true,
                    Message = "Ok",
                    Promotion = promo
                }, JsonRequestBehavior.AllowGet);
            }
            catch (WarrantyPromotionValidationException ex)
            {
                return Json(new
                {
                    Result = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);

            }

        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsEdit)]
        [HttpDelete]
        public ActionResult Delete(int id)
        {
            warrantyPromotionsRepository.Delete(id);
            return Json(new
            {
                Success = true
            });
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        public ActionResult GetPromotionsForWarranty(int warrantyId)
        {
            var promotions = warrantyPromotionsRepository.GetPromotionsForWarranty(warrantyId, clock.UtcNow)
                .Select(p => new
                {
                    p.BranchName,
                    p.BranchNumber,
                    p.BranchType,
                    p.EndDate,
                    p.Id,
                    p.PercentageDiscount,
                    p.RetailPrice,
                    p.StartDate,
                    p.WarrantyId,
                    p.WarrantyNumber
                })
                .Distinct()//since there is multiple prices for the same warranty, a Distinct (excluding the WarrantyPriceId property) is needed
                .ToList();
            return Json(promotions, JsonRequestBehavior.AllowGet);
        }

        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        [HttpGet]
        public ViewResult PromotionsForWarrantyPrice()
        {
            return View();
        }

        [HttpPost]
        [Permission(Cosacs.Warranty.WarrantyPermissionEnum.PromotionsView)]
        public JsonResult GetPromotionsForWarrantyPrice(int warrantyId, int warrantyPriceId)
        {
            return Json(
                warrantyPromotionsRepository.GetPromotionsForWarranty(warrantyId, clock.UtcNow, new List<int> { warrantyPriceId }),
                JsonRequestBehavior.AllowGet);
        }
    }
}
