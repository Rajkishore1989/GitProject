namespace Blue.Cosacs.Web.Controllers
{
    using System.Linq;
    using System.Web.Mvc;

    public class LocalisationController : Controller
    {
        private readonly Config.Settings settings;
        private readonly Merchandising.Settings merchandisingSettings;

        public LocalisationController(Config.Settings settings, Merchandising.Settings merchandisingSettings)
        {
            this.settings = settings;
            this.merchandisingSettings = merchandisingSettings;
        }

        public ActionResult Index()
        {
            var currencySymbol = settings.CurrencySymbol;
            var decimalPlaces = settings.DecimalPlaces;
            var priceRounding = merchandisingSettings.PriceRounding
                .Select(p =>
                    {
                        int val;
                        if (int.TryParse(p, out val))
                        {
                            return (int?)val;
                        }
                        return null;
                    })
                .Where(p => p != null)
                .OrderBy(p => p)
                .ToList();
            var dateFormat = merchandisingSettings.DateFormat;
            var localCurrency = merchandisingSettings.LocalCurrency;

            return Json(new { CurrencySymbol = currencySymbol, DecimalPlaces = decimalPlaces, priceRounding, dateFormat, localCurrency }, JsonRequestBehavior.AllowGet);
        }
    }
}
