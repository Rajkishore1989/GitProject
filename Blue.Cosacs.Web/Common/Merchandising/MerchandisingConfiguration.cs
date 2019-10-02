namespace Blue.Cosacs.Web.Common.Merchandising
{
    using System.Configuration;
    using Blue.Cosacs.Merchandising.Infrastructure;

    public class MerchandisingConfiguration : IMerchandisingConfiguration
    {
        public bool IsMaster
        {
            get
            {
                bool value;
                bool.TryParse(ConfigurationManager.AppSettings["Merchandising:IsMaster"], out value);
                return value;
            }
        }

        public string MasterAuthKey
        {
            get
            {
                return ConfigurationManager.AppSettings["Merchandising:MasterAuthKey"];
            }
        }

        public string MasterAuthPass
        {
            get
            {
                return ConfigurationManager.AppSettings["Merchandising:MasterAuthPass"];
            }
        }

        public string MasterServiceRoute
        {
            get
            {
                return ConfigurationManager.AppSettings["Merchandising:MasterServiceRoute"];
            }
        }
    }
}