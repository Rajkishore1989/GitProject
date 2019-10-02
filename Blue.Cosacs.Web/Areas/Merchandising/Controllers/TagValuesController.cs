namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising;
    using System;
    using System.Web.Mvc;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Cosacs.Web.Helpers;

    public class TagValuesController : Controller
    {
        private readonly TagValuesRepository repository;

        public TagValuesController(TagValuesRepository tagsRepository)
        {
            repository = tagsRepository;
        }

        [Permission(MerchandisingPermissionEnum.TagValuesView)]
        public ActionResult Index()
        {
            return View(repository.Get());
        }

        public ActionResult Save(Tag model)
        {
            if (ModelState.IsValid)
            {
                var user = this.GetUser();
                if (!user.HasPermission(MerchandisingPermissionEnum.TagFirstYearWarrantyEdit) && !user.HasPermission(MerchandisingPermissionEnum.TagConditionValuesEdit))
                {
                    throw new UnauthorizedAccessException();
                }

                repository.Save(model);
                repository.SaveRepossessedConditions(model);

                return new JSendResult(JSendStatus.Success);
            }

            return new JSendResult(JSendStatus.BadRequest, ModelState.ErrorsToArray());
        }
    }
}
