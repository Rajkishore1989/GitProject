namespace Blue.Cosacs.Web.Areas.Merchandising.Controllers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    using Blue.Config.Repositories;
    using Blue.Cosacs.Merchandising.Helpers;
    using Blue.Cosacs.Merchandising.Models;
    using Blue.Cosacs.Merchandising.Repositories;
    using Blue.Cosacs.Merchandising.Solr;
    using Blue.Cosacs.Messages.Merchandising.Vendors;
    using Blue.Cosacs.Web.Controllers;
    using Blue.Hub.Client;

    public class VendorSubscriberController : HttpHubSubscriberController<VendorRecordHeader>
    {
        private readonly List<string> errors = new List<string>();
        private readonly string isoCountryCode;
        private readonly ISupplierRepository supplierRepository;
        private readonly IVendorSolrIndexer vendorSolrIndexer;

        public VendorSubscriberController(ISupplierRepository supplierRepository, IVendorSolrIndexer vendorSolrIndexer)
        {
            this.supplierRepository = supplierRepository;
            this.isoCountryCode = new Settings().Get("ISOCountryCode");
            this.vendorSolrIndexer = vendorSolrIndexer;
        }

        protected override void Sink(int id, VendorRecordHeader vendorMessageModel)
        {
            this.ValidateMessage(vendorMessageModel);
            var model = this.MapMessageToSupplierModel(vendorMessageModel);
            var vendor = this.supplierRepository.Save(model);
            this.vendorSolrIndexer.Index(new[] { vendor.Id });
        }

        private void ValidateMessage(VendorRecordHeader vendorMessageModel)
        {
            var company = vendorMessageModel.CompanySection.CompanyRec.Company;
            var status = vendorMessageModel.CompanySection.CompanyRec.VendorStatus;
            var type = vendorMessageModel.CompanySection.CompanyRec.VendorType;
            var name = vendorMessageModel.VendorName;
            var code = vendorMessageModel.VendorCode;
            var country = vendorMessageModel.VendorDetail.Record.VendorCountry;

            if (!this.CompanyCountryIsValid(company))
            {
                this.errors.Add("Mismatched country code");
            }

            if (!this.VendorCountryIsValid(country))
            {
                this.errors.Add("Vendor country must be a two letter ISO country code");
            }

            if (!this.CompanyIsValid(company))
            {
                this.errors.Add("Company must be 'UNICOMER'");
            }

            if (!this.StatusIsValid(status))
            {
                this.errors.Add("Status must be 'A' or 'I'");
            }

            if (!this.TypeIsValid(type))
            {
                this.errors.Add("Type must be either Local, International or CARICOM");
            }

            if (!this.NameIsValid(name, code))
            {
                this.errors.Add("Vendor Name belongs to an existing vendor with a different Vendor Code");
            }

            if (this.errors.Any())
            {
                throw new MessageValidationException(string.Join("; ", this.errors), null);
            }
        }

        private string GetCompany(string company)
        {
            var countryCodeParts = company.Split('_').Skip(1).ToList();
            if (!countryCodeParts.Any())
            {
                return string.Empty;
            }
            return countryCodeParts.First();
        }

        private string GetCountry(string company)
        {
            var countryCodeParts = company.Split('_').ToList();
            if (!countryCodeParts.Any())
            {
                return string.Empty;
            }
            return countryCodeParts.First();
        }

        private bool CompanyCountryIsValid(string company)
        {
            return this.GetCountry(company) == this.isoCountryCode;
        }

        private bool VendorCountryIsValid(string country)
        {
            return country != null && country.Length == 2;
        }

        private bool CompanyIsValid(string company)
        {
            return string.Equals(this.GetCompany(company), "UNICOMER", StringComparison.OrdinalIgnoreCase);
        }

        public bool StatusIsValid(string status)
        {
            return string.Equals(status, "A", StringComparison.OrdinalIgnoreCase) || string.Equals(status, "I", StringComparison.OrdinalIgnoreCase);
        }

        public bool TypeIsValid(string type)
        {
            return string.Equals(type, "LOCAL", StringComparison.OrdinalIgnoreCase) || string.Equals(type, "INTERNATIONAL", StringComparison.OrdinalIgnoreCase)
                   || string.Equals(type, "CARICOM", StringComparison.OrdinalIgnoreCase);
        }

        public bool NameIsValid(string name, string code)
        {
            return this.supplierRepository.CanUseNameWithCode(name, code);
        }

        private SupplierImportModel MapMessageToSupplierModel(VendorRecordHeader message)
        {
            var contacts = new List<StringKeyValue>();
            contacts.Add(new StringKeyValue("Contact Name", message.VendorDetail.Record.ContactName.ToTitleCase(TitleCaseOptions.ConvertAll)));
            contacts.Add(new StringKeyValue("Contact Email", message.VendorDetail.Record.ContactEmail));
            contacts.Add(new StringKeyValue("Contact Phone", message.VendorDetail.Record.ContactPhone));
            contacts.Add(new StringKeyValue("Company Phone", message.VendorDetail.Record.CompanyPhone));

            var model = new SupplierImportModel
                            {
                                Name = message.VendorName.ToTitleCase(), 
                                Type = this.FixVendorTypeCase(message.CompanySection.CompanyRec.VendorType), 
                                Status = string.Equals(message.CompanySection.CompanyRec.VendorStatus, "A", StringComparison.OrdinalIgnoreCase) ? 1 : 2, 
                                Code = message.VendorCode, 
                                PaymentTerms = message.VendorDetail.Record.PaymentTerms, 
                                AddressLine1 = message.VendorDetail.Record.AddressLine1, 
                                AddressLine2 = message.VendorDetail.Record.AddressLine2, 
                                City = message.VendorDetail.Record.City, 
                                State = message.VendorDetail.Record.State, 
                                Country = message.VendorDetail.Record.VendorCountry, 
                                PostCode = message.VendorDetail.Record.PostalCode, 
                                Contacts = contacts, 
                            };

            return model;
        }

        private string FixVendorTypeCase(string type)
        {
            if (string.Equals(type, "CARICOM", StringComparison.OrdinalIgnoreCase))
            {
                return "CARICOM";
            }
            return type.ToTitleCase(TitleCaseOptions.ConvertAll);
        }
    }
}