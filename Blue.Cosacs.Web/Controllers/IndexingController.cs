using Blue.Cosacs.Warehouse.Common;
using Blue.Cosacs.Web.Areas.Admin.Controllers;
using Blue.Cosacs.Web.Areas.Merchandising.Controllers;
using Blue.Cosacs.Web.Areas.Service.Controllers;
using Blue.Cosacs.Web.Areas.Warehouse.Controllers;
using Blue.Cosacs.Web.Areas.Warranty.Controllers;
using Blue.Glaucous.Client.Mvc;
using System;
using System.Web.Mvc;

namespace Blue.Cosacs.Web.Controllers
{
    public class IndexingController : Controller
    {
        public IndexingController(PickingController picking, BookingsController booking, DeliveryController delivery, UsersController users,
                                  RequestsController service, WarrantyAPIController warranty, LocationsController location,
                                  ProductsController product, VendorsController vendor, PromotionController promotion, PurchaseController purchaseOrder,
                                  GoodsReceiptController goodsReceipt
            /*,CatalogueController stock,*/
            //WarrantySalesController warrantySales
            )
        {
            this.picking = picking;
            this.booking = booking;
            this.delivery = delivery;
            this.users = users;
            this.service = service;
            this.warranty = warranty;
            //this.warrantySales = warrantySales;
            //this.stock = stock;
            this.location = location;
            this.product = product;
            this.vendor = vendor;
            this.promotion = promotion;
            this.purchaseOrder = purchaseOrder;
            this.goodsReceipt = goodsReceipt;
        }

        private readonly PickingController picking;

        private readonly BookingsController booking;

        private readonly DeliveryController delivery;

        private readonly UsersController users;

        private readonly RequestsController service;

        private readonly WarrantyAPIController warranty;

        private readonly LocationsController location;

        private readonly ProductsController product;

        private readonly VendorsController vendor;

        private readonly PromotionController promotion;

        private readonly PurchaseController purchaseOrder;

        private readonly GoodsReceiptController goodsReceipt;

        [HttpGet]
        [Permission(WarehousePermissionEnum.Reindex)]
        public ActionResult Index()
        {
            return View();
        }

        private enum SolrDocumentType
        {
            PickList,
            Booking,
            /// <summary>
            /// Load as in Delivery
            /// </summary>
            Load,
            User,
            ServiceRequest, // serviceRequest
            Warranty, // warranty
            //WarrantySale,
            //Product, //non merchandising stock
            Location, //merchandising locations
            MerchandiseStock, //all merchandising product stock levels for a location
            MerchandiseStockSummary,//all merchandising product stock levels
            MerchandiseVendor, //all vendors
            MerchandisePromotion,
            MerchandisePurchaseOrder,
            MerchandiseGoodsReceipt
        }

        private void TruncateByType(SolrDocumentType type)
        {
            try
            {
                new Blue.Solr.WebClient().DeleteByType(type.ToString());
            }
            catch (Exception) { }
        }

        [HttpPost]
        [LongRunningQueries]
        [Permission(WarehousePermissionEnum.Reindex)]
        public ActionResult Reindex(bool doPicking = false, bool doBooking = false, bool doDelivery = false,
                                    bool doUsers = false, bool doService = false, bool doWarranty = false,
                                    bool doWarrantySales = false, bool doStock = false, bool doLocation = false,
                                    bool doMerchandiseStockLevels = false, bool doVendors = false, bool doPromotions = false,
                                    bool doPurchaseOrders = false, bool doGoodsReceipt = false)
        {
            //// delete everything first
            //new Blue.Solr.WebClient().Truncate();

            if (doPicking)
            {
                TruncateByType(SolrDocumentType.PickList);
                picking.ForceIndex();
            }
            if (doBooking)
            {
                TruncateByType(SolrDocumentType.Booking);
                booking.ForceIndex();
            }
            if (doDelivery)
            {
                TruncateByType(SolrDocumentType.Load);
                delivery.ForceIndex();
            }
            if (doUsers)
            {
                TruncateByType(SolrDocumentType.User);
                users.ForceIndex();
            }
            if (doService)
            {
                TruncateByType(SolrDocumentType.ServiceRequest);
                service.ForceIndex();
            }
            if (doWarranty)
            {
                TruncateByType(SolrDocumentType.Warranty);
                warranty.ForceIndex();
            }
            //if (doWarrantySales)
            //{
            //    TruncateByType(SolrDocumentType.WarrantySale);
            //   warrantySales.ForceIndex();
            //}
            //if (doStock)
            //{
            //   TruncateByType(SolrDocumentType.Product);
            //  stock.ForceIndex();
            //}
            if (doLocation)
            {
                TruncateByType(SolrDocumentType.Location);
                location.ForceIndex();
            }
            if (doMerchandiseStockLevels)
            {
                TruncateByType(SolrDocumentType.MerchandiseStock);
                TruncateByType(SolrDocumentType.MerchandiseStockSummary);
                product.ForceIndex();
            }
            if (doVendors)
            {
                TruncateByType(SolrDocumentType.MerchandiseVendor);
                vendor.ForceIndex();
            }
            if (doPromotions)
            {
                TruncateByType(SolrDocumentType.MerchandisePromotion);
                promotion.ForceIndex();
            }
            if (doPurchaseOrders)
            {
                TruncateByType(SolrDocumentType.MerchandisePurchaseOrder);
                purchaseOrder.ForceIndex();
            }
            if (doGoodsReceipt)
            {
                TruncateByType(SolrDocumentType.MerchandiseGoodsReceipt);
                goodsReceipt.ForceIndex();
            }


            // Pattern PRG - Post/Redirect/Get
            return RedirectToAction("IndexingDone", new { doPicking, doBooking, doDelivery, doUsers, doService, doWarranty, /*doWarrantySales, doStock,*/ doLocation, doMerchandiseStockLevels, doVendors, doPromotions, doPurchaseOrders, doGoodsReceipt });
        }

        [HttpGet]
        public ActionResult IndexingDone(bool doPicking = false, bool doBooking = false, bool doDelivery = false,
                                         bool doUsers = false, bool doService = false, bool doWarranty = false,
                                         bool doWarrantySales = false, bool doStock = false, bool doLocation = false,
                                         bool doMerchandiseStockLevels = false, bool doVendors = false, bool doPromotions = false,
                                         bool doPurchaseOrders = false, bool doGoodsReceipt = false)
        {
            ViewBag.doPicking = doPicking;
            ViewBag.doBooking = doBooking;
            ViewBag.doDelivery = doDelivery;
            ViewBag.doUsers = doUsers;
            ViewBag.doService = doService;
            ViewBag.doWarranty = doWarranty;
            ViewBag.doWarrantySales = doWarrantySales;
            ViewBag.doStock = doStock;
            ViewBag.doLocation = doLocation;
            ViewBag.doMerchandiseStockLevels = doMerchandiseStockLevels;
            ViewBag.doVendors = doVendors;
            ViewBag.doPromotions = doPromotions;
            ViewBag.doPurchaseOrders = doPurchaseOrders;
            ViewBag.doGoodsReceipt = doGoodsReceipt;

            return View();
        }
    }
}
