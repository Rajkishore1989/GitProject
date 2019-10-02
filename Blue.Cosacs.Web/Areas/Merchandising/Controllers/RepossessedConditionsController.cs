using System.Linq;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class RepossessedConditionsController : Controller
    {
        private readonly IRepossessedConditionsRepository repository;

        public RepossessedConditionsController(IRepossessedConditionsRepository repository)
        {
            this.repository = repository;
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedConditionsView)]
        public ActionResult Index()
        {
            var conditions = this.repository.Get().Select(c => new EditRepossessedCondition { Id = c.Id, Name = c.Name, SKUSuffix = c.SKUSuffix }).ToList();

            return View(conditions);
        }

        public JSendResult Get()
        {
            var condition = this.repository.Get().Select(c => new EditRepossessedCondition { Id = c.Id, Name = c.Name, SKUSuffix = c.SKUSuffix }).ToList();

            return new JSendResult(JSendStatus.Success, condition);
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedConditionsEdit)]
        public JSendResult Create(RepossessedCondition repossessedCondition)
        {
            repossessedCondition.SKUSuffix = repossessedCondition.SKUSuffix.ToUpper();
            if (!this.repository.CanCreate(repossessedCondition))
            {
                var condition = this.repository.Create(repossessedCondition);
                return new JSendResult(JSendStatus.Success, condition);
            }
            return new JSendResult(JSendStatus.BadRequest, message: "A condition already exists with the same name or suffix");
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedConditionsEdit)]
        public JSendResult Update(EditRepossessedCondition repossessedCondition)
        {
            repossessedCondition.SKUSuffix = repossessedCondition.SKUSuffix.ToUpper();
            if (!this.repository.Exists(repossessedCondition))
            {
                var condition = this.repository.Update(repossessedCondition);
                return new JSendResult(JSendStatus.Success, condition);
            }
            return new JSendResult(JSendStatus.BadRequest, message: "A condition already exists with the same name or suffix");
        }

        [Permission(Cosacs.Merchandising.MerchandisingPermissionEnum.RepossessedConditionsEdit)]
        public JSendResult Delete(int id)
        {
            if (repository.HasHierarchyTags(id) || repository.HasProducts(id))
            {
                return new JSendResult(JSendStatus.BadRequest, message: "Cannot delete a condition that has associated products or tag values");
            }

            repository.Delete(id);
            return new JSendResult(JSendStatus.Success);
        }
    }
}