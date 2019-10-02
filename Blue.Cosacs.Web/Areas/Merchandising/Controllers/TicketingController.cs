using System.Web.Mvc;
using Blue.Cosacs.Merchandising;
using Blue.Cosacs.Merchandising.Models;
using Blue.Cosacs.Web.Common;
using System.Text;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System.Linq;
    using Blue.Cosacs.Merchandising.Repositories;

    public class TicketingController : Controller
    {
        private readonly ITicketingRepository ticketingRepository;

        public TicketingController(ITicketingRepository ticketingRepository)
        {
            this.ticketingRepository = ticketingRepository;
        }
         [HttpGet]
        [Permission(MerchandisingPermissionEnum.Ticketing)]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        [Permission(MerchandisingPermissionEnum.Ticketing)]
        public FileResult Export()
        {
            const string FileHeader =
                "Product Code, Model Number, Brand,Fascia, Location, Long Description, POS Description,Feature and Benefit1, Feature and Benefit2, Feature and Benefit3, Feature and Benefit4, Feature and Benefit5, Feature and Benefit6, Feature and Benefit7, Feature and Benefit8, Feature and Benefit9, Feature and Benefit10, Effective Date, Current Cash Price, Current Regular Price, Set Code, Set Description, Component1, Component2, Component3, Component4, Component5, Component6, Component7, Component8, Component9, Component10, Normal Cash Price, Normal Regular Price, Duty Free Price";

            var file = FileHeader + "\r" + BaseImportFile<TicketingViewModel>.WriteToString(ticketingRepository.GetTickets().ToList());
          
            var fileName = string.Concat("TicketExtract", System.DateTime.Today.ToString(), ".csv");

            return File(Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName.ToString());
        }
    }
}