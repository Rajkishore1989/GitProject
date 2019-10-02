namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Collections.Generic;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Cosacs.Web.Helpers;
    using Blue.Glaucous.Client.Mvc;

    public class TransactionTypeController : Controller
    {
        private readonly ITransactionTypeRepository repository;

        public TransactionTypeController(ITransactionTypeRepository repository)
        {
            this.repository = repository;
        }

        [Permission(MerchandisingPermissionEnum.TransactionTypeView)]
        public ViewResult Index()
        {
            return View(repository.Get());
        }

        [Permission(MerchandisingPermissionEnum.TransactionTypeEdit)]
        public JsonResult Save(List<TransactionTypeUpdateModel> model)
        {
            if (!ModelState.IsValid)
            {
                return new JSendResult(JSendStatus.BadRequest, message: string.Join(",", ModelState.GetErrors()));
            }
            repository.Update(model);
            return new JSendResult(JSendStatus.Success);
        }
    }
}