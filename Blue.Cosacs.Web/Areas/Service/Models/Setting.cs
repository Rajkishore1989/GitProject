using Blue.Config;
using System.Collections.Generic;
using System.Linq;

namespace Blue.Cosacs.Web.Areas.Service.Models
{
    public class Setting
    {
        public IModule module
        {
            get;
            set;
        }

        public List<IGrouping<string, SettingValues>> settings
        {
            get;
            set;
        }

    }

    public class SettingValues
    {
        public IModule module
        {
            get;
            set;
        }

        public string category
        {
            get;
            set;
        }

        public object meta
        {
            get;
            set;
        }

        public string value
        {
            get;
            set;
        }
    }

}