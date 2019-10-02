using System.Linq;
using System.Web.Mvc;
using Blue.Config.Event;
using Blue.Events;
using StructureMap;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Config.Controllers
{
    public class SettingsController : Controller
    {

        public SettingsController(IContainer container, IEventStore audit, IClock clock)
        {
            this.container = container;
            this.audit = audit;
            this.clock = clock;
        }

        private readonly IContainer container;
        private readonly IClock clock;
        private readonly IEventStore audit;

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.ViewSystemSettingsConfig)]
        public ActionResult Index()
        {
            var all = container.GetAllInstances<Blue.Config.ISettings>();
            return View(all);
        }

        [HttpPost]
        [Permission(Blue.Config.ConfigPermissionEnum.EditSystemSettingsConfig)]
        public void Save(string @namespace, string id, string value)
        {
            var settings = container.GetInstance<Blue.Config.ISettings>(@namespace);
            try
            {
                var module = GetAllSettingsModules().Where(e => e.Namespace == @namespace).Single();
                var setting = GetModuleSetting(module, id);

                var settingsReader = (Blue.Config.ISettingsReader)settings;

                List<string> currentList = null;
                if (setting.Type == Blue.Config.SettingMetadata.SettingsTypeEnum.list)
                    currentList = settingsReader.List(id).ToList();

                settings.Set(id, value);

                var userData = this.GetUser();
                if (setting.Type == Blue.Config.SettingMetadata.SettingsTypeEnum.list)
                {
                    #region Log Settings of Type List
                    //#12176
                    List<string> newList = settingsReader.List(id).ToList();
                    StringBuilder ItemsAdded = new StringBuilder();
                    StringBuilder ItemsRemoved = new StringBuilder();

                    //Create a list of new items added to the Pick List
                    for (int i = 0; i < newList.Count(); i++)
                    {
                        if (currentList.IndexOf(newList[i]) == -1)
                        {
                            if (ItemsAdded.Length != 0)
                                ItemsAdded.Append(",");

                            ItemsAdded.Append(newList[i]);
                        }
                    }

                    //Create a list of existing items removed from the Pick List
                    for (int i = 0; i < currentList.Count(); i++)
                    {
                        if (newList.IndexOf(currentList[i]) == -1)
                        {
                            if (ItemsRemoved.Length != 0)
                                ItemsRemoved.Append(",");

                            ItemsRemoved.Append(currentList[i]);
                        }
                    }

                    audit.Log(new { Module = module.Label + " (" + @namespace + ")", Name = setting.Name, ItemsAdded = ItemsAdded.ToString(), ItemsRemoved = ItemsRemoved.ToString() },
                        EventType.SettingSave, Blue.Config.Event.EventCategory.Configuration,
                        new { UserId = userData.Id, SecurityType = User.Identity });
                    #endregion
                }
                else
                {
                    #region Log Generic Settings
                    audit.Log(new { @namespace = module.Label + " (" + @namespace + ")", Name = id, value = value },
                        EventType.SettingSave, Blue.Config.Event.EventCategory.Administration,
                        new { UserId = userData.Id, SecurityType = User.Identity });
                    #endregion
                }
            }
            catch (System.ArgumentException ex)
            {
                Response.StatusCode = 400;
                Response.StatusDescription = ex.Message;
            }
        }

        private Blue.Config.IModule[] GetAllSettingsModules()
        {
            var allSettings = container.GetAllInstances<Blue.Config.ISettings>();
            var result = from settings in allSettings
                         select settings.Module;

            return result.ToArray();
        }

        private Blue.Config.SettingMetadata GetModuleSetting(Blue.Config.IModule module, string id)
        {
            var allSettings = container.GetAllInstances<Blue.Config.ISettings>();
            var result = (from settings in allSettings
                          where settings.Module.Namespace == module.Namespace
                          let setting = (from metadata in settings.Metadata()
                                         where metadata.Id == id
                                         select metadata).Single()
                          select setting).Single();

            return result;
        }

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.ViewSystemSettingsConfig)]
        public JsonResult ModulesMetadata()
        {
            var allSettings = container.GetAllInstances<Blue.Config.ISettings>();
            var result = from settings in allSettings
                         select new
                         {
                             module = settings.Module
                         };

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.ViewSystemSettingsConfig)]
        public JsonResult Metadata(string moduleNamespace)
        {
            //var query = from dtt in decisionTableTypes
            //            select repository.LoadByKey(dtt);
            var result = GetModuleSettings(moduleNamespace).First();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        private List<Service.Models.Setting> GetModuleSettings(string moduleNamespace)
        {
            List<Blue.Cosacs.Web.Areas.Service.Models.Setting> result = null;

            var allSettings = container.GetAllInstances<Blue.Config.ISettings>();
            result = (from settings in allSettings
                      where moduleNamespace == null || settings.Module.Namespace == moduleNamespace
                      select new Blue.Cosacs.Web.Areas.Service.Models.Setting
                      {
                          module = settings.Module,
                          settings = (from m in settings.Metadata()
                                      select new Blue.Cosacs.Web.Areas.Service.Models.SettingValues
                                      {
                                          category = m.Category,
                                          meta = m,
                                          value = settings.Display(m.Id)
                                      })
                                      .GroupBy(e => e.category).ToList()
                      }).ToList();

            return result;
        }

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.ViewSystemSettingsConfig)]
        public JsonResult GetSetting(string moduleNamespace, string category = null)
        {
            List<Service.Models.SettingValues> results = new List<Service.Models.SettingValues>();

            var allModuleSettings = GetModuleSettings(moduleNamespace);
            allModuleSettings.ForEach(m =>
            {
                m.settings.ForEach(sGroup =>
                {
                    foreach (var tmpSetting in sGroup)
                    {
                        if (tmpSetting.category == category || category == null)
                        {
                            results.Add(new Service.Models.SettingValues()
                            {
                                module = m.module,
                                category = tmpSetting.category,
                                meta = tmpSetting.meta,
                                value = tmpSetting.value
                            });
                        }
                    }
                });
            });

            return Json(results, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult GetTime()
        {
            return Json(new { date = clock.Now.ToString("o") }, JsonRequestBehavior.AllowGet);
        }
    }
}