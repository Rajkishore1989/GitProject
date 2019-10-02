using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Web.Common;

    public class BrandController : Controller
    {
        private readonly IBrandRepository brandRepository;

        // GET: Merchandising/Brand
        public BrandController(IBrandRepository brandRepository)
        {
            this.brandRepository = brandRepository;
        }

        public ActionResult Index()
        {
            return new JSendResult(JSendStatus.Success, brandRepository.GetAll().ToDictionary(k => k.Id, v => v.BrandName));
        }
    }
}