using Blue.Cosacs.Warranty.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class WarrantySubscriberController : Web.Controllers.HttpHubSubscriberController<Cosacs.Warranty.Messages.Order>
    {
        private readonly SalesRepository repository;

        public WarrantySubscriberController(SalesRepository repository)
        {
            this.repository = repository;
        }

        protected override void Sink(int id, Cosacs.Warranty.Messages.Order order)
        {
           // this.repository.CreateWarrantySale(order, this.GetUser().FullName);
            
            //if (order.PotentialWarranties.Any())
            //{
            //    this.repository.AddPotentialWarranties(order, this.GetUser().FullName);
            //}

            this.repository.CancelWarrantySale(order, this.GetUser().FullName);
        }
    }
}
