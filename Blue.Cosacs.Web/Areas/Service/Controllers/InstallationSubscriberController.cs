using Blue.Cosacs.Service.Models;
using Blue.Cosacs.Service.Repositories;
using Blue.Cosacs.Web.Common;
using System.Collections.Generic;
using System.Linq;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Service.Controllers
{
    public class InstallationSubscriberController : Web.Controllers.HttpHubSubscriberController<Cosacs.Service.Messages.Order>
    {
        private readonly SalesRepository repository;

        public InstallationSubscriberController(SalesRepository repository)
        {
            this.repository = repository;
        }

        protected override void Sink(int id, Cosacs.Service.Messages.Order order)
        {
            var items = new List<Cosacs.Service.Messages.Item>(order.Items);
            var installations = items.Where(x => x.ItemTypeId == (int)SalesRepository.ItemTypeEnum.Installation).ToList();

            if (!installations.Any())
            {
                return;
            }

            if (installations.Where(i => i.Returned).Any())
            {
                repository.CloseInternalInstallationRequest(order, LastUpdated());
            }

            if (installations.Where(i => !i.Returned).Any())
            {
                var ids = Enumerable.Range(1, installations.Where(i => !i.Returned).Sum(p => p.Quantity))
                    .Select(p => HiLo.Cache("Service.Request").NextId())
                    .ToList();

                repository.CreateInternalInstallationRequest(ids, order, LastUpdated());
            }           
        }

        private LastUpdated LastUpdated()
        {
            return new LastUpdated()
            {
                LastUpdatedUser = this.GetUser().Id,
                LastUpdatedUserName = this.GetUser().FullName
            };
        }
    }
}