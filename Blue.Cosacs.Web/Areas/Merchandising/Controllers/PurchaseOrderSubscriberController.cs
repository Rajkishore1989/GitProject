namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Messages.Merchandising.PurchaseOrder;
    using Blue.Glaucous.Client.Mvc;
    using Blue.Hub.Client;
    using System;
    using System.Collections.Generic;
    using System.Linq;

    public class PurchaseOrderSubscriberController : Web.Controllers.HttpHubSubscriberController<POCreation>
    {
        private readonly IPurchaseRepository purchaseRepository;
        private readonly IProductRepository productRepository;
        private readonly ISupplierRepository supplierRepository;
        private readonly ILocationRepository locationRepository;
        private readonly IPurchaseOrderSolrIndexer purchaseOrderSolrIndexer;
        private readonly string companyCode;
        private readonly List<string> errors = new List<string>();

        public PurchaseOrderSubscriberController(IPurchaseRepository purchaseRepository, IProductRepository productRepository, ISupplierRepository supplierRepository, ILocationRepository locationRepository, IPurchaseOrderSolrIndexer purchaseOrderSolrIndexer)
        {
            this.purchaseRepository = purchaseRepository;
            this.productRepository = productRepository;
            this.supplierRepository = supplierRepository;
            this.locationRepository = locationRepository;
            this.purchaseOrderSolrIndexer = purchaseOrderSolrIndexer;
            companyCode = new Blue.Config.Repositories.Settings().Get("ISOCountryCode").ToUpper() + "_UNICOMER";
        }

        protected override void Sink(int id, POCreation purchaseOrderMessageModel)
        {
            ValidateMessage(purchaseOrderMessageModel);
            var model = MapMessageToModel(purchaseOrderMessageModel);

            var purchaseOrder = purchaseRepository.Create(model);
            this.purchaseOrderSolrIndexer.Index(new[] { purchaseOrder.Id });
        }

        private void ValidateMessage(POCreation message)
        {
            ValidateCreationDate(message.CreationDate);
            ValidateExpectedDeliveryDate(message.ExpectedDeliveryDate);
            ValidateExchangeRateFactor(message.ExchangeRateFactor);
            ValidateOrderedDetail(message.OrderDetail);
            ValidatePoNumber(message.OriginSystem, message.PONumber);
            ValidateOriginSystem(message.OriginSystem);
            ValidateOriginModule(message.OriginSystem, message.OriginModule);
            ValidateDestinationSystem(message.DestinationSystem);
            ValidatePoSource(message.POSource, message.CompanySection.CompanyRec.POType);
            ValidateCommissionChargeFlag(message.CommissionChargeFlag, message.OriginSystem);
            ValidateExchangeRateType(message.ExchangeRateType);
            ValidateCurrencyCode(message.CurrencyCode);
            ValidateForeignCurrencyCode(message.ForeignCurrencyCode);
            ValidateShipVia(message.ShipVia);
            ValidateCompany(message.CompanySection.CompanyRec.Company);
            ValidateType(message.CompanySection.CompanyRec.POType);
            ValidateTotalUnitsOnOrder(message);
            ValidateTotalExtendedPreLandedCost(message);

            if (errors.Any())
            {
                throw new MessageValidationException(string.Join(Environment.NewLine, errors), null);
            }
        }

        private PurchaseOrderCreateModel MapMessageToModel(POCreation message)
        {
            var user = HttpContext.GetUser();
            var model = new PurchaseOrderCreateModel
            {
                ReceivingLocationId = GetLocationId(message.Warehouse),
                Products = GetProducts(message.OrderDetail, message.ExpectedDeliveryDate),
                VendorId = GetVendorId(message.VendorCode),
                Attributes = GetAttributes(message.AttributeSection),
                CreatedDate = message.CreationDate,
                Currency = message.ForeignCurrencyCode,
                CommissionChargeFlag = message.CommissionChargeFlag,
                CommissionPercentage = message.CommissionPercentage,
                Company = message.CompanySection.CompanyRec.Company,
                CorporatePoNumber = message.PONumber,
                OriginSystem = message.OriginSystem,
                PaymentTerms = message.Incoterm,
                PortOfLoading = message.PortOfLoading,
                RequestedDeliveryDate = message.ExpectedDeliveryDate,
                ShipDate = message.ShipDate,
                ShipVia = message.ShipVia,
                CreatedById = user.Id,
                CreatedBy = user.FullName
            };

            return model;
        }

        private List<PurchaseOrderProductImportModel> GetProducts(Record[] orderDetail, DateTime deliveryDate)
        {
            var skus = orderDetail.Select(x => x.SkuNumber).Where(x => !string.IsNullOrEmpty(x)).Distinct();
            var products = productRepository.SearchBySku(skus).Select(s => new { s.SKU, s.Id, s.LabelRequired }).Distinct()
                                            .ToDictionary(d => d.SKU, d => new { Id = d.Id.Value, LabelRequired = d.LabelRequired });

            if (skus.Any(s => !products.ContainsKey(s)) && skus.Count() == products.Count())
            {
                var ninjas = skus.Except(products.Select(s => s.Key)).ToList();
                var message = string.Format("These SKUs could not be found in the Merchandising system: ({0})", string.Join(", ", ninjas));
                throw new MessageValidationException(message, null);
            }

            return orderDetail
                .Select(message =>
                new PurchaseOrderProductImportModel
                {
                    Comments = message.SkuComments,
                    QuantityOrdered = message.OrderedUnits,
                    PreLandedExtendedCost = message.PreLandedExtendedCost,
                    PreLandedUnitCost = message.PreLandedUnitCost,
                    ProductId = products[message.SkuNumber].Id,
                    RequestedDeliveryDate = message.SkuDeliveryDate ?? deliveryDate,
                    SupplierUnitCost = message.SupplierUnitCost,
                    LabelRequired = products[message.SkuNumber].LabelRequired
                }).ToList();
        }

        public void ValidatePoNumber(string originSystem, string corporatePoNumber)
        {
            if (string.IsNullOrEmpty(corporatePoNumber))
            {
                errors.Add("PO Number is not specified");
            }
            if (!purchaseRepository.CorporatePoNumberIsUnique(originSystem, corporatePoNumber))
            {
                throw new InvalidOperationException(string.Format("Purchase Order {0} #{1} already exists", originSystem, corporatePoNumber));
            }
        }

        private int GetVendorId(string vendorCode)
        {
            var vendor = supplierRepository.LocateResource(vendorCode);
            if (vendor == null)
            {
                throw new MessageValidationException(string.Format("Vendor code ({0}) could not be found in the Merchandising system", vendorCode), null);
            }
            return vendor.Id;
        }

        private int GetLocationId(string warehouse)
        {
            var salesId = warehouse.Substring(0, 3);
            var location = locationRepository.LocateBySalesId(salesId);
            if (location == null)
            {
                throw new MessageValidationException(string.Format("Warehouse ({0}) could not be found in the Merchandising system", warehouse), null);
            }
            return location.Id;
        }

        private List<PurchaseOrderAttribute> GetAttributes(AttributeRec[] attributeRecs)
        {
            return attributeRecs.Select(x =>
                new PurchaseOrderAttribute
                {
                    CategoryId = x.CategoryId,
                    Id = x.AttributeId,
                    Value = x.AttributeValue
                }).ToList();
        }

        private void ValidateOrderedDetail(Record[] orderDetail)
        {
            foreach (var o in orderDetail)
            {
                if (o.OrderedUnits < 1)
                {
                    errors.Add(string.Format("Ordered units for SKU {0} is 0", o.SkuNumber));
                }
                if (o.SupplierUnitCost < 1)
                {
                    errors.Add(string.Format("Supplier Unit Cost for SKU {0} is 0", o.SkuNumber));
                }
                if (o.SupplierExtendedCost != o.OrderedUnits * o.SupplierUnitCost)
                {
                    errors.Add(string.Format("Supplier Extended Cost for SKU {0} is not valid for the given Supplier Unit Cost and Ordered Units", o.SkuNumber));
                }
                if (o.PreLandedExtendedCost < 1)
                {
                    errors.Add(string.Format("PreLanded Extended Cost for SKU {0} is 0", o.SkuNumber));
                }
            }
        }

        private void ValidateExchangeRateFactor(decimal? exchangeRateFactor)
        {
            if (exchangeRateFactor == null)
            {
                errors.Add("Exchange Rate Factor must be specified");
            }
        }

        private void ValidateExpectedDeliveryDate(DateTime expectedDeliveryDate)
        {
            if (expectedDeliveryDate == DateTime.MinValue)
            {
                errors.Add("Expected Delivery Date must be specified");
            }
        }

        private void ValidateCreationDate(DateTime creationDate)
        {
            if (creationDate == DateTime.MinValue)
            {
                errors.Add("Creation Date must be specified");
            }
        }

        private void ValidateOriginSystem(string value)
        {
            if (!value.Equals("EBS11I", StringComparison.OrdinalIgnoreCase)
             && !value.Equals("RP3", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Origin System must be 'EBS11i' or 'RP3'");
            }
        }

        private void ValidateOriginModule(string originSystem, string originModule)
        {
            if (originSystem.Equals("EBS11I", StringComparison.OrdinalIgnoreCase) && !originModule.Equals("AR", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Origin Module must be 'AR' for system 'EBS11i'");
            }

            if (originSystem.Equals("RP3", StringComparison.OrdinalIgnoreCase) && !originModule.Equals("OF", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Origin Module must be 'OF' for system 'RP3'");
            }
        }

        private void ValidateDestinationSystem(string value)
        {
            if (!value.Equals("MERCHANDISE SYSTEM", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Destination System must be 'Merchandise System'");
            }
        }

        private void ValidatePoSource(string source, string type)
        {
            if (source.Equals("RP3 LOCAL PO", StringComparison.OrdinalIgnoreCase) && !type.Equals("LOCAL", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("PO Source of 'RP3 Local PO' must have a PO Type of 'Local'");
            }

            if (source.Equals("RP3 CARICOM PO", StringComparison.OrdinalIgnoreCase) && !type.Equals("CARICOM", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("PO Source of 'RP3 CARICOM PO' must have a PO Type of 'CARICOM'");
            }

            if (source.Equals("RP3 INTERNATIONAL PO", StringComparison.OrdinalIgnoreCase) && !type.Equals("INTERNATIONAL", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("PO Source of 'RP3 International PO' must have a PO Type of 'International'");
            }
        }

        private void ValidateCommissionChargeFlag(string value, string originSystem)
        {
            if (value != null)
            {
                if (originSystem.Equals("EBS11I") && !value.Equals("Y", StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add("Commission Charge Flag must be null or 'Y' for system 'EBS11i'");
                }
                else if (originSystem.Equals("RP3") && !value.Equals("N", StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add("Commission Charge Flag must be null or 'N' for system 'RP3'");
                }
                else if (!value.Equals("N", StringComparison.OrdinalIgnoreCase) && !value.Equals("Y", StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add("Commission Charge Flag must be null, 'Y' or 'N'");
                }
            }
        }

        private void ValidateExchangeRateType(string value)
        {
            if (value != null && !value.Equals("D", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Exchange Rate Type must be 'D' if specified");
            }
        }

        private void ValidateCurrencyCode(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                errors.Add("Currency Code must be specified");
            }
            else if (value.Length != 3)
            {
                errors.Add("Currency Code must be 3 characters in length");
            }
        }

        private void ValidateForeignCurrencyCode(string value)
        {
            if (!value.Equals("USD", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Foreign Currency Code must be 'USD'");
            }
        }

        private void ValidateShipVia(string value)
        {
            if (value != null
             && !value.Equals("AIR", StringComparison.OrdinalIgnoreCase)
             && !value.Equals("SEA", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Ship Via must be 'Air' or 'Sea' if specified");
            }
        }

        private void ValidateCompany(string value)
        {
            if (!value.Equals(companyCode, StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("Company must be " + companyCode);
            }
        }

        private void ValidateType(string value)
        {
            if (!value.Equals("LOCAL", StringComparison.OrdinalIgnoreCase)
             && !value.Equals("CARICOM", StringComparison.OrdinalIgnoreCase)
             && !value.Equals("INTERNATIONAL", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add("PO Type must be 'Local', 'International' or 'CARICOM'");
            }
        }

        private void ValidateTotalUnitsOnOrder(POCreation po)
        {
            var specifiedTotal = po.SummarySection.TotalUnitsOnOrder;
            var sum = po.OrderDetail.Sum(x => x.OrderedUnits);
            if (specifiedTotal != sum)
            {
                errors.Add(string.Format("Total units on order ({0}) does not match the actual number of units ordered ({1})", specifiedTotal, sum));
            }
        }

        private void ValidateTotalExtendedPreLandedCost(POCreation po)
        {
            var specifiedTotal = po.SummarySection.TotalExtendedSupplierCost.ToString("F0");
            var sum = po.OrderDetail.Sum(x => x.SupplierExtendedCost).ToString("F0");
            if (specifiedTotal != sum)
            {
                errors.Add(string.Format("Total supplier extended cost ({0}) does not match the actual sum of for all records ({1})", specifiedTotal, sum));
            }
        }
    }
}