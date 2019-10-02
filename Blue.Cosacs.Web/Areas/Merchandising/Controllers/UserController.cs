namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Web.Mvc;

    using Blue.Cosacs.Merchandising;
    using Blue.Cosacs.Merchandising.Infrastructure;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Web.Common;
    using Blue.Hub.Client;
    using Blue.Glaucous.Client.Mvc;

    public class UserController : Controller
    {
        private readonly IUserRepository userRepository;
        private readonly ILog log;

        public UserController(
            IUserRepository userRepository, 
            ILog log)
        {
            this.userRepository = userRepository;
            this.log = log;
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Index()
        {
            return new JSendResult(JSendStatus.Success, userRepository.Get());
        }

        [Permission(MerchandisingPermissionEnum.GoodsReceiptEdit)]
        public JSendResult Permissions(int userId)
        {
            return new JSendResult(JSendStatus.Success, userRepository.Permissions(userId));
        }
    }
}
