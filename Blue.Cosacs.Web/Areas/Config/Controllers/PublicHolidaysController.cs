using System;
using System.Linq;
using System.Web.Mvc;
using Blue.Config.Repositories;
using Domain = Blue.Config;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Config.Controllers
{
    public class PublicHolidaysController : Controller
    {

        private readonly PublicHolidayRepository repository;
        private readonly IClock clock;

        public PublicHolidaysController(IClock clock, PublicHolidayRepository publicHolidayRepository)
        {
            this.clock = clock;
            this.repository = publicHolidayRepository;
        }

        [HttpGet]
        [Permission(Blue.Config.ConfigPermissionEnum.PublicHolidays)]
        public ActionResult Index()
        {
            //var year = yearToDisplay.HasValue ? yearToDisplay.Value : clock.Now.Year;
            //return View(repository.dates(year));
            return View(repository.dates());

        }


        //Add or remove selected public holiday 
        [HttpPost]
        [Permission(Blue.Config.ConfigPermissionEnum.PublicHolidays)]
        public void AddRemoveDate(DateTime date)
        {

            using (var scope = Domain.Context.Write())
            {
                var publicHoliday = (from p in scope.Context.PublicHoliday
                                     where p.Date == date
                                     select p).FirstOrDefault();

                if (publicHoliday == null)
                {
                    publicHoliday = new Domain.PublicHoliday
                    {
                        Date = date
                    };

                    scope.Context.PublicHoliday.Add(publicHoliday);

                }
                else
                {
                    scope.Context.PublicHoliday.Remove(publicHoliday);
                }

                scope.Context.SaveChanges();
                scope.Complete();
            }

        }
    }
}
