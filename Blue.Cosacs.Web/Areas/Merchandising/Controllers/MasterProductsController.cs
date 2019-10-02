namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Web.Mvc;

    using Blue.Collections.Generic;
    using Blue.Cosacs.Merchandising.Enums;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;
    using Blue.Glaucous.Client.Mvc;

    public class MasterProductsController : Controller
    {
        private readonly IProductRepository productRepository;
        private readonly IMerchandisingHierarchyRepository hierarchyRepository;

        public MasterProductsController(IProductRepository productRepo, IMerchandisingHierarchyRepository hierarchyRepo)
        {
            productRepository = productRepo;
            hierarchyRepository = hierarchyRepo;
        }
    }
}
