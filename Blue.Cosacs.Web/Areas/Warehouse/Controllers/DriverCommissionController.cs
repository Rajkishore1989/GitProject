using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Web.Areas.Warehouse.Models;
using Blue.Cosacs.Web.Common;
using Blue.Events;
using Domain = Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class DriverCommissionController : Controller
    {
        private readonly IClock clock;
        private readonly IEventStore audit;
        public DriverCommissionController(IClock clock, IEventStore audit)
        {
            this.clock = clock;
            this.audit = audit;
        }

        [HttpGet]
        [Permission(WarehousePermissionEnum.DriverComissions)]
        public ViewResult Index()
        {
            audit.LogAsync(new { }, EventType.Index, EventCategory.DriverCommissionIndex);
            return View(this.LoadData());
        }

        [HttpGet]
        public FileResult Export(int id)
        {
            var dc = this.LoadDataToExport(id);
            var fileName = string.Format("driverexport{0}.csv", id.ToString());

            var file = "Export,Schedule,Stock Branch,Schedule On,Delivered On,Pickings,Schedule Total,Exported On, Exported By,Driver Id, Driver Name\n" +
                BaseImportFile<ExportDriverCommissionView>.WriteToString(dc
                .Select(p => (ExportDriverCommissionView)p)
                .ToList());
            audit.LogAsync(new { DriverCommissionId = id }, EventType.Warehouse, EventCategory.DriverCommission);
            return File(System.Text.Encoding.GetEncoding("Windows-1252").GetBytes(file), "text/plain", fileName);
        }

        public PartialViewResult CreateExport()
        {
            var newDriverCommission = CreateNewExportRecords();

            if (newDriverCommission == null)
            {
                //nothing to export
                return null;
            }
            else
            {
                audit.LogAsync(new { }, EventType.Warehouse, EventCategory.DriverCommissionCreateExport);
                return PartialView("DriverCommissionLine", newDriverCommission);
            }
        }

        private Blue.Cosacs.Web.Areas.Warehouse.Models.DriverCommission LoadData()
        {
            using (var scope = Domain.Context.Read())
            {
                return new Blue.Cosacs.Web.Areas.Warehouse.Models.DriverCommission(scope.Context.DriverCommission.Select(p => p).OrderByDescending(p => p.Id).ToList());
            }
        }

        private List<Domain.DriverCommissionView> LoadDataToExport(int id)
        {
            List<Domain.DriverCommissionView> values;
            using (var scope = Domain.Context.Read())
            {
                values = scope.Context.DriverCommissionView
                    .Where(p => p.Id == id)
                    .ToList();
            }
            return this.JoinDataToExport(values);
        }


        private Domain.DriverCommission CreateNewExportRecords()
        {
            using (var scope = Domain.Context.Write())
            {
                if (scope.Context.Load
                    .Join(scope.Context.Booking, l => l.Id, b => b.ScheduleId, (lo, bo) => new
                    {
                        lo.DriverCommissionId,
                        DeliveryRejected = (!bo.DeliveryRejected.HasValue ? true : bo.DeliveryRejected.Value)
                    })
                    .Count(p => !p.DriverCommissionId.HasValue && !p.DeliveryRejected) > 0)
                {
                    var newItem = new Domain.DriverCommission()
                    {
                        CreatedBy = this.UserId(),
                        CreatedOn = this.clock.UtcNow   //#11457
                    };

                    scope.Context.DriverCommission.Add(newItem);
                    scope.Context.SaveChanges();

                    var count = scope.Context.Database.ExecuteSqlCommand("UPDATE Warehouse.[Load] SET DriverCommissionId = @DriverCommissionId WHERE DriverCommissionId IS NULL", new SqlParameter("DriverCommissionId", newItem.Id));

                    if (count != 0)
                    {
                        scope.Complete();
                        return newItem;
                    }
                }
                return null;
            }
        }

        private List<Domain.DriverCommissionView> JoinDataToExport(List<Domain.DriverCommissionView> values)
        {
            var returnValue = new List<Cosacs.Warehouse.DriverCommissionView>();

            //join all the picking in a single line and sun the total
            var rows = values.GroupBy(p => p.ScheduleId).ToList();
            foreach (var item in rows)
            {
                var newPickingId = new StringBuilder();
                var newTotal = (decimal?)0;
                var newITem = item.First();

                foreach (var grp in item)
                {
                    newPickingId.Append(grp.PickingId).Append("; ");
                    newTotal = grp.LineTotal.Value + newTotal.Value;
                }

                newITem.PickingId = newPickingId.ToString().Substring(0, newPickingId.Length - 2);//remove the last "; "
                newITem.LineTotal = newTotal;

                returnValue.Add(newITem);
            }

            return returnValue;
        }
    }
}
