using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web.Mvc;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Warehouse.Repositories;
using Blue.Cosacs.Warehouse.Search;
using Blue.Cosacs.Warehouse.Utils;
using Blue.Cosacs.Web.Areas.Warehouse.Models;
using Blue.Cosacs.Web.Common;
using Blue.Events;
using Blue.Glaucous.Client.Mvc;
using Blue.Transactions;
using StructureMap;
using Domain = Blue.Cosacs.Warehouse;

namespace Blue.Cosacs.Web.Areas.Warehouse.Controllers
{
    public class PickingController : Controller
    {
        public PickingController(IContainer container, IEventStore audit, BookingRepository repository, IClock clock, ZoneRepository zoneRepository)
        {
            this.clock = clock;
            this.repository = repository;
            this.zoneRepository = zoneRepository;
            this.container = container;
            this.audit = audit;
        }

        private readonly IClock clock;
        private readonly BookingRepository repository;
        private readonly ZoneRepository zoneRepository;
        private readonly IContainer container;
        private readonly IEventStore audit;

        [Permission(WarehousePermissionEnum.Picking)]
        public ActionResult Index()
        {
            var bs = new BookingSearch();
            ViewBag.DefaultBranch = bs.DeliveryBranch = this.UserDefaultBranch();
            var totalBookings = repository.AllBookings(bs);

            if (totalBookings > 250)
            {
                ViewBag.TotalBookings = "(showing 250 of " + totalBookings + ")";
            }
            else
            {
                ViewBag.TotalBookings = "(showing " + totalBookings + " of " + totalBookings + ")";
            }

            return View();
        }

        [HttpGet]
        public JsonResult Trucks(short? deliveryBranch = null)
        {
            using (var scope = Context.Read())
            {
                var query = scope.Context.TruckPendingView.AsQueryable();
                if (deliveryBranch.HasValue)
                    query = query.Where(t => t.Branch == deliveryBranch);

                return Json(query.ToArray(), JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult Bookings(BookingSearch s)
        {
            using (var scope = Context.Read())
            {
                var trucks = scope.Context.TruckPendingView.AsQueryable();

                if (s.DeliveryBranch.HasValue)
                {
                    trucks = trucks.Where(t => t.Branch == s.DeliveryBranch);
                }

                var retValues = new
                {
                    Bookings = repository.Pending(0, 250, s).ToList(),
                    TotalBookings = repository.AllBookings(s),
                    Trucks = trucks.ToArray()
                };

                return Json(retValues, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPut]
        public JsonResult BookingPicked(int bookingId, int truckId)
        {
            int relatedCount;
            Domain.Booking booking;
            using (var scope = Context.Write())
            {
                booking = (from b in scope.Context.Booking
                           where b.Id == bookingId
                           select b).First();

                booking.TruckId = truckId;
                booking.PickingAssignedBy = this.UserId();
                booking.PickingAssignedDate = clock.UtcNow;
                scope.Context.SaveChanges();
                scope.Complete();
            }
            audit.LogAsync(new { shipmentId = bookingId, truckId }, EventType.PickingPicked, EventCategory.Warehouse);

            using (var scope = Context.Read())
            {
                relatedCount = (from b in scope.Context.Booking
                                join c in scope.Context.Cancellation on b.Id equals c.Id into ct
                                from cancellation in ct.DefaultIfEmpty()
                                where
                                cancellation == null &&
                                b.AddressLine1 == booking.AddressLine1 &&
                                b.AddressLine2 == booking.AddressLine2 &&
                                b.AddressLine3 == booking.AddressLine3 &&
                                b.PostCode == booking.PostCode &&
                                b.CustomerName == booking.CustomerName &&
                                b.PickUp == false &&
                                b.DeliveryOrCollectionDate == booking.DeliveryOrCollectionDate &&
                                b.TruckId == null && b.Id != booking.Id &&
                                b.DeliveryBranch == booking.DeliveryBranch
                                select b).Count();
            }
            return Json(relatedCount, JsonRequestBehavior.AllowGet);
        }

        [HttpPut]
        public JsonResult BookRelated(int bookingId, int truckId)
        {
            int[] ids;
            using (var scope = Context.Write())
            {
                var booking = (from b in scope.Context.Booking
                               where b.Id == bookingId
                               select b).First();

                var related = (from b in scope.Context.Booking
                               join c in scope.Context.Cancellation on b.Id equals c.Id into ct
                               from cancellation in ct.DefaultIfEmpty()
                               where
                               cancellation == null &&
                               b.AddressLine1 == booking.AddressLine1 &&
                               b.AddressLine2 == booking.AddressLine2 &&
                               b.AddressLine3 == booking.AddressLine3 &&
                               b.PostCode == booking.PostCode &&
                               b.CustomerName == booking.CustomerName &&
                               b.PickUp == false &&
                               b.DeliveryOrCollectionDate == booking.DeliveryOrCollectionDate &&
                               b.TruckId == null && b.Id != booking.Id &&
                               b.DeliveryBranch == booking.DeliveryBranch
                               select b).ToList();
                related.ForEach(b =>
                {
                    b.TruckId = truckId;
                    b.PickingAssignedBy = this.UserId();
                    b.PickingAssignedDate = clock.UtcNow;
                });
                ids = related.Select(r => r.Id).ToArray();
                scope.Context.SaveChanges();
                scope.Complete();
            }
            audit.LogAsync(new { shipmentId = bookingId, truckId }, EventType.PickingPicked, EventCategory.Warehouse);
            return Json(ids, JsonRequestBehavior.AllowGet);
        }

        [HttpPut]
        public void BookingUnPicked(int bookingId)
        {
            using (var scope = Context.Write())
            {
                var booking = (from b in scope.Context.Booking
                               where b.Id == bookingId
                               select b).First();

                booking.TruckId = null;
                booking.PickingAssignedBy = null;
                booking.PickingAssignedDate = null;
                scope.Context.SaveChanges();
                scope.Complete();
            }
            audit.LogAsync(new { shipmentId = bookingId }, EventType.PickingUnPicked, EventCategory.Warehouse);
        }

        #region Create Pick Lists
        private Domain.Picking PickingNew(WriteScope<Domain.Context> scope)
        {
            var picking = new Domain.Picking
            {
                Createdby = this.UserId(),
                CreatedOn = clock.UtcNow
            };
            scope.Context.Picking.Add(picking);
            scope.Context.SaveChanges();
            return picking;
        }

        private IList<Domain.Picking> Create(string eventType, int branchId,
                                             Func<IQueryable<Domain.Booking>, IEnumerable<Domain.Booking>> query)
        {
            return Create(eventType, branchId, query, (bookings) => new[] { bookings });
        }

        private IList<Domain.Picking> Create(string eventType, int branchId,
                                             Func<IQueryable<Domain.Booking>, IEnumerable<Domain.Booking>> query,
                                             Func<IEnumerable<Domain.Booking>, IEnumerable<IEnumerable<Domain.Booking>>> groupBy)
        {
            var pickings = new List<Picking>();
            var bookingIds = (List<int>)null;

            using (var scope = Domain.Context.Write())
            {
                var bookings = query(from b in scope.Context.Booking
                                     where b.PickingId == null
                                        && b.TruckId != null
                                        && b.DeliveryBranch == branchId
                                     select b).ToList();

                if (bookings.Count == 0)
                {
                    scope.Complete();
                    return null; // finish early if possible
                }

                bookingIds = bookings
                    .Select(p => p.BookingId)
                    .ToList();

                foreach (var group in groupBy(bookings))
                {
                    // create pick list for this group
                    var picking = PickingNew(scope);
                    var allAutoPicked = true;

                    foreach (var booking in group)
                    {
                        booking.PickingId = picking.Id;
                        allAutoPicked &= booking.AutoPick();

                        var qtyToUpdate = booking.DeliveryOrCollection == "C" ? booking.CurrentQuantity : -Convert.ToInt32(booking.CurrentQuantity);

                        new UpdateStockQty() { itemId = booking.ItemId, stockLocn = booking.StockBranch, qty = qtyToUpdate }.ExecuteNonQuery();
                    }

                    if (allAutoPicked)
                    {
                        picking.AutoPick(clock);
                    }

                    pickings.Add(picking);
                }

                scope.Context.SaveChanges();
                // save everything in the end
                scope.Complete();
            }

            var ids = pickings.Select(p => p.Id).ToArray();
            if (ids.Length > 0)
            {
                ForceIndex(ids);
            }

            if (bookingIds.Count > 0)
            {
                ReindexBookings(bookingIds);
            }

            SetIsOriginal();
            audit.Log(new
            {
                PickListIds = ids
            }, eventType, "Warehouse");

            return pickings;
        }

        /// <summary>
        /// Create a single pick list with every item pending.
        /// </summary>
        [HttpPost]
        public JsonResult CreateByNothing(short branchId)
        {
            audit.LogAsync(new { branch = branchId }, EventType.CreatePickListAll, EventCategory.Warehouse);
            return Json(Create("CreatePickListByAll", branchId, q => q));
        }

        /// <summary>
        /// Create a pick list with all the pending picking items on the given branch and truck.
        /// </summary>
        [HttpPost]
        public JsonResult CreateByTruck(short branchId, int truckId)
        {
            audit.LogAsync(new { branch = branchId, truck = truckId }, EventType.CreatePickListByTruck, EventCategory.Warehouse);
            var pickings = Create("CreatePickListByTruck", branchId, q => q.Where(b => b.TruckId == truckId));
            Debug.Assert(pickings == null || pickings.Count <= 1);
            return Json(pickings == null ? null : pickings.FirstOrDefault());
        }

        /// <summary>
        /// Create a pick list with all the pending picking items on the given branch and truck.
        /// </summary>
        [HttpPost]
        public JsonResult CreateByTruckLoad(short branchId)
        {
            audit.LogAsync(new { branch = branchId }, EventType.CreatePickListByTrucks, EventCategory.Warehouse);
            return Json(Create("CreatePickListByTruckLoad", branchId, q => q,
                q => q.GroupBy(b => b.TruckId.Value)));
        }

        /// <summary>
        /// Create a pick list with all the pending picking items on the given branch and truck.
        /// </summary>
        [HttpPost]
        public JsonResult CreateByProductCategory(short branchId)
        {
            audit.LogAsync(new { branch = branchId }, EventType.CreatePickListByCategory, EventCategory.Warehouse);
            return Json(Create("CreatePickListByProductCategory", branchId, q => q,
                q => q.GroupBy(b => b.ProductCategory)));
        }

        /// <summary>
        /// Create a pick list with all the pending picking items on the given branch and truck.
        /// </summary>
        [HttpPost]
        public JsonResult CreateByWarehouseZone(short branchId)
        {
            var zoneMapper = zoneRepository.GetMapper(branchId);

            return Json(Create("CreatePickListByWarehouseZone", branchId, q => q,
               q => q.GroupBy(b => WarehouseZone(zoneMapper, b))));
        }

        private int? WarehouseZone(IZoneMapper zoneMapper, Domain.Booking b)
        {
            var warehouseZone = zoneMapper.Map(new Dictionary<string, string> 
                        { 
                            { "ItemId", b.ItemId.ToString() }, 
                            { "ItemNo", b.ItemNo },
                            { "ItemUPC", b.ItemUPC }, 
                            { "ProductArea", b.ProductArea },
                            { "ProductBrand", b.ProductBrand }, 
                            { "Category", b.ProductCategory }, 
                        });
            return warehouseZone;
        }

        private void SetIsOriginal()
        {
            TempData["IsCopy"] = false;
        }

        private bool IsCopy
        {
            get
            {
                return TempData.ContainsKey("IsCopy") ? (bool)TempData["IsCopy"] : true;
            }
        }

        #endregion

        #region Printing
        [HttpGet]
        public ActionResult Print(int id)
        {
            // TODO zone mapping
            // var branchId = records.First().DeliveryBranch;
            // ViewBag.ZoneMapper = zoneRepository.GetMapper(branchId);
            return PrintLoad(new[] { id });
        }

        [HttpGet]
        public ActionResult PrintMany(string ids)
        {
            var pickingIds = ids.Split(',').Where(s => s.Trim().Length > 0).Select(id => int.Parse(id));
            return PrintLoad(pickingIds.ToArray());
        }

        private ActionResult PrintLoad(int[] ids)
        {
            ViewBag.IsCopy = IsCopy;
            audit.LogAsync(new { PickLists = ids }, IsCopy ? EventType.RePrintMultiplePickList : EventType.PrintMultiplePickList, EventCategory.Warehouse);

            using (var scope = Domain.Context.Read())
            {
                ViewBag.UserName = this.GetUser().FullName;
                return View("PrintMany",
                    (from p in scope.Context.PickListView
                     where ids.Contains(p.Id)
                        && p.DeliveryBranch == p.StockBranch // we only pick if the stock is here :)
                        && DeliveryOrCollection.Collection.Code != p.DeliveryOrCollection
                     orderby
                        p.Id,
                        p.TruckId,
                        p.DeliveryOrCollectionDate
                     select p).ToList());
            }
        }
        #endregion

        #region Search

        [Permission(WarehousePermissionEnum.SearchPickLists)]
        public ActionResult Search(string q = "")
        {
            return View(model: SearchSolr(q));
        }

        [HttpGet]
        public JsonResult ForceIndex(int[] ids = null)
        {
            audit.LogAsync(new { }, EventType.PickingIndex, EventCategory.Index);
            return Json(SolrIndex.Picking(ids), JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public void SearchInstant(string q, int start = 0)
        {
            var result = SearchSolr(q, start);
            Response.Write(result);
        }

        private string SearchSolr(string q, int start = 0, int rows = 25, string type = "PickList")
        {
            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: new[] { "StockBranchName", "Trucks", "PickingEmployees", "PickingStatus" },
                // the order that the fields appear on the search page are determined by the order of this array
                   showEmpty: false,
                   start: start,
                   rows: rows
                   );
        }
        #endregion

        #region Picking Confirmation
        [HttpGet]
        public ActionResult Confirmation(int? id)
        {
            if (!id.HasValue) { id = 0; }

            using (var scope = Domain.Context.Read())
            {
                var picking = scope.Context.Picking.Find(id);
                if (picking != null && picking.PickedOn.HasValue)
                {
                    picking.PickedOn = picking.PickedOn.Value; //#13913 no more needed --> .ToLocalTime();    //#12979
                }

                var bookings = scope.Context.BookingView                //#10577
                    .Where(b => b.PickingId == id
                                 && b.DeliveryBranch == b.StockBranch // only confirm picking of local stock
                                 && DeliveryOrCollection.Collection.Code != b.DeliveryOrCollection)
                    .OrderBy(b => b.DeliveryOrCollectionDate)
                    .ToList();

                var result = new Blue.Cosacs.Web.Areas.Warehouse.Models.PickingConfirmation
                 {
                     Picking = picking,
                     Bookings = bookings
                 };
                ViewBag.ActionName = "Picked";
                ViewBag.RejectListName = "Blue.Cosacs.Warehouse.PICKREJECT";
                ViewBag.PickingId = picking.Id;

                //LoadEmployees();
                //LoadPickingItemStatus();
                ViewBag.StartWithViewMode = picking != null && picking.ConfirmedBy.HasValue ? "true" : "false";

                return View(result);
            }
        }

        [HttpPut]
        public void Confirmation(PickListConfirmation request)
        {
            var bookingIds = (List<int>)null;
            using (var scope = Cosacs.Warehouse.Context.Write())
            {
                var record = scope.Context.Picking.Find(request.Id);

                if (record.ConfirmedBy.HasValue)
                    throw new System.InvalidOperationException(string.Format("Pick List #{0} confirmation cannot be saved as it has already been confirmed", record.Id));

                record.CheckedBy = request.CheckedBy;
                record.ConfirmedBy = this.UserId();
                record.PickedBy = request.PickedBy;
                record.PickedOn = request.PickedOn; //#13913 no more needed --> .ToUniversalTime();   // #10702
                record.ConfirmedOn = clock.UtcNow;         // #13951 
                record.Comment = request.Comment;

                var bookings = (from b in scope.Context.Booking
                                where
                                    b.PickingId == record.Id
                                    && b.DeliveryBranch == b.StockBranch // we only pick if the stock is here :)
                                /*&& b.DeliveryOrCollection == "D"*/
                                select b).ToList();


                bookings.Where(b => b.DeliveryBranch != b.StockBranch).ToList().ForEach(b =>
                {
                    b.PickingRejected = false;
                    b.PickQuantity = b.CurrentQuantity;
                    b.PickingComment = "Picking not Required";
                });

                if (request.PickingItems != null)
                {
                    var bookfind = bookings.ToDictionary(b => b.Id);

                    foreach (var requestPickingItem in request.PickingItems)
                    {
                        var booking = bookfind[requestPickingItem.Id];
                        var quant = string.IsNullOrWhiteSpace(requestPickingItem.RejectedReason) ? booking.CurrentQuantity : Convert.ToInt32(requestPickingItem.PickedQuantity);

                        booking.PickingRejected = !string.IsNullOrWhiteSpace(requestPickingItem.RejectedReason);
                        booking.PickingRejectedReason = requestPickingItem.RejectedReason;
                        booking.PickingComment = requestPickingItem.Comment;
                        booking.PickQuantity = quant;
                    }
                }

                BookingException.CreateRejections(bookings, this.clock, (b) =>
                {
                    Debug.Assert(b.PickQuantity.HasValue, "We must have Picking Quantity at this point.");
                    return (short)(b.Quantity - b.PickQuantity.Value);
                });

                bookingIds = scope.Context.Booking.Local.Select(s => s.Id).ToList();
                scope.Context.SaveChanges();
                audit.LogAsync(new
                {
                    confirmation = new
                    {
                        ConfirmationId = record.Id,
                        CreatedBy = record.Createdby,
                        CreatedOn = record.CreatedOn.ToLocalTime(),      //#15487
                        CheckedBy = record.CheckedBy,
                        ConfirmedBy = record.ConfirmedBy,
                        ConfirmedOn = record.ConfirmedOn,
                        Comment = record.Comment,
                        PickedBy = record.PickedBy,
                        PickedOn = record.PickedOn,
                        PickedByName = record.PickedByName,
                        CheckedByName = record.CheckedByName
                    },
                    items = bookings.Select(b => new { shipmentId = b.Id, pickQuantity = b.PickQuantity, pickingRejected = b.PickingRejected, pickingRejectedReason = b.PickingRejectedReason })
                }, EventCategory.Warehouse, EventType.ConfirmPickList);
                scope.Complete();
            }

            SolrIndex.Picking(new[] { request.Id });
            if (bookingIds.Count > 0)
            {
                ReindexBookings(bookingIds);
            }
        }

        private void ReindexBookings(List<int> bookingIds)
        {
            SolrIndex.Booking(bookingIds.ToArray());
        }

        private class CodeItem
        {
            public string Code
            {
                get;
                set;
            }
            public string CodeDescript
            {
                get;
                set;
            }
            public string Reference
            {
                get;
                set;
            }
        }

        #endregion

        public ActionResult Reference()
        {
            return View();
        }

        public ActionResult DeliveryList()
        {
            return View();
        }
    }
}
