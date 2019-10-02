using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Domain = Blue.Cosacs.Warehouse;
using System.Data.Linq.SqlClient;
using Blue.Cosacs.Warehouse.Common;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class DriverPaymentsController : Controller
    {
        private readonly IEventStore audit;
        private readonly Blue.Config.Settings settings;
        public DriverPaymentsController(IEventStore audit, Blue.Config.Settings settings)
        {
            this.audit = audit;
            this.settings = settings;
        }

        [HttpGet]
        [Permission(WarehousePermissionEnum.InternalDriverPaymentsView)]
        public virtual ActionResult Index(int? page)
        {
            ViewData.Add("DefaultNew", DefaultNew());
            ViewBag.CurrencySymbol = settings.CurrencySymbol;
            return View(Load());
        }

        [HttpGet]
        public PartialViewResult RecordEdit(int id)
        {
            return RecordEdit(Load(id));
        }

        private PartialViewResult RecordEdit(DriverPaymentView t)
        {
            return PartialView(new Models.DriverPayment(t));
        }

        [HttpPost]
        [Permission(WarehousePermissionEnum.InternalDriverPaymentsEdit)]
        public ActionResult Create(DriverPaymentView payment)
        {
            if (ModelState.IsValid)
            {
                DriverPaymentView paymentView;
                using (var scope = Domain.Context.Write())
                {
                    DriverPayment p = new DriverPayment
                    {
                        SendingBranch = payment.SendingBranch,
                        ReceivingBranch = payment.ReceivingBranch,
                        Size = payment.Size,
                        Value = payment.Value
                    };

                    scope.Context.DriverPayment.Add(p);
                    scope.Context.SaveChanges();

                    paymentView = scope.Context.DriverPaymentView.Find(p.Id);

                    scope.Complete();
                }
                Response.StatusCode = 201;
                audit.LogAsync(new { Id = paymentView.Id, SendingBranch = paymentView.SendingBranch, ReceivingBranch = paymentView.ReceivingBranch, Size = paymentView.Size, Value = paymentView.Value }, EventType.DriverPaymentCreate, EventCategory.Warehouse);
                return PartialView("RecordView", paymentView);
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(payment);
            }
        }

        [HttpPut]
        [Permission(WarehousePermissionEnum.InternalDriverPaymentsEdit)]
        public ActionResult Update(int id, DriverPaymentView payment)
        {
            if (ModelState.IsValid)
            {
                DriverPaymentView paymentView;
                using (var scope = Domain.Context.Write())
                {
                    var record = scope.Context.DriverPayment.Find(id);
                    record.SendingBranch = payment.SendingBranch;
                    record.ReceivingBranch = payment.ReceivingBranch;
                    record.Size = payment.Size;
                    record.Value = payment.Value;
                    scope.Context.SaveChanges();

                    paymentView = scope.Context.DriverPaymentView.Find(id);
                    scope.Complete();
                }
                audit.LogAsync(new { DriverPayment = payment }, EventType.DriverPaymentUpdate, EventCategory.Warehouse);
                return PartialView("RecordView", paymentView);
            }
            else
            {
                Response.StatusCode = 400;
                return RecordEdit(payment);
            }
        }

        [HttpDelete]
        [Permission(WarehousePermissionEnum.InternalDriverPaymentsEdit)]
        public void Delete(int id)
        {
            try
            {
                using (var scope = Domain.Context.Write())
                {
                    var payment = scope.Context.DriverPayment.Find(id);
                    if (payment != null)
                    {
                        scope.Context.DriverPayment.Remove(payment);
                        scope.Context.SaveChanges();
                        audit.LogAsync(new { DriverPayment = payment }, EventType.DriverPaymentDelete, EventCategory.Warehouse);
                    }
                    scope.Complete();
                }
            }
            catch (ApplicationException e)
            {
                Response.StatusCode = 400;
                Response.StatusDescription = e.Message;
                Response.End();
            }
        }

        private IEnumerable<DriverPaymentView> Load()
        {
            using (var scope = Domain.Context.Read())
            {
                return scope.Context.DriverPaymentView.ToList();
            }
        }

        private DriverPaymentView Load(int id)
        {
            using (var scope = Domain.Context.Read())
            {
                return scope.Context.DriverPaymentView.Find(id);
            }
        }

        private Models.DriverPayment DefaultNew()
        {
            return new Models.DriverPayment();
        } 
    }
}
