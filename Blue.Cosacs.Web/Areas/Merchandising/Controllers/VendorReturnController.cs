namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;
    using System;
    using System.Linq;
    using System.Web.Mvc;

    public class VendorReturnController : Controller
    {
        private readonly IVendorReturnRepository vendorReturnRepository;

        public VendorReturnController(IVendorReturnRepository vendorReturnRepository)
        {
            this.vendorReturnRepository = vendorReturnRepository;
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult New(int id, string receiptType)
        {
            var model = vendorReturnRepository.New(id);
            return View("Detail", model);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Detail(int id)
        {
            var model = vendorReturnRepository.Get(id);
            return View("Detail", model);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Index()
        {
            var model = vendorReturnRepository.Search(new VendorReturnSearchQueryModel(), 10, 0);
            return View("Index", model);
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Search(VendorReturnSearchQueryModel query, int pageSize, int pageIndex)
        {
            var model = vendorReturnRepository.Search(query, pageSize, pageIndex > 0 ? pageIndex - 1 : 0);
            return new JSendResult(JSendStatus.Success, model);
        }
        
        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public JSendResult Get(int id, string receiptType)
        {
            return new JSendResult(JSendStatus.Success, vendorReturnRepository.Get(id));
        }

        [HttpPost]
        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Create(VendorReturnCreateModel model)
        {
            if (ModelState.IsValid)
            {
                if (model.VendorReturnProducts.Sum(v => v.QuantityReturned ?? 0) > 0)
                {
                    var user = HttpContext.GetUser();
                    try
                    {
                        var vendorReturn = vendorReturnRepository.Create(model, user);
                        return new JSendResult(JSendStatus.Success, vendorReturn);
                    }
                    catch (InvalidProductException ex)
                    {
                        return new JSendResult(JSendStatus.Error, message: ex.Message);
                    }
                }
                return new JSendResult(JSendStatus.BadRequest, message: "Invalid return quantities");
            }

            return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
        }

        [Permission(MerchandisingPermissionEnum.VendorReturnApprove)]
        public JSendResult Approve(int id, string referenceNumber, string comments, DateTime dateApprove)
        {
            var user = HttpContext.GetUser();
            vendorReturnRepository.Approve(id, user.Id, referenceNumber, comments, dateApprove);
            return new JSendResult(JSendStatus.Success, new { user.Id, Name = user.FullName, DateApproved = dateApprove });
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult Print(int id, string receiptType)
        {
            return View(vendorReturnRepository.Print(id));
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptView)]
        public ActionResult PrintWithCost(int id, string receiptType)
        {
            return View(vendorReturnRepository.Print(id));
        }
    }
}
