using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Blue.Cosacs.Warranty.Repositories;

namespace Blue.Cosacs.Web.Areas.Warranty.Common
{
    public class Search
    {
        public Search(WarrantyHierachyRepository warrantyHierachyRepository)
        {
            this.warrantyHierachyRepository = warrantyHierachyRepository;
        }

        private readonly WarrantyHierachyRepository warrantyHierachyRepository;

        public string SearchSolr(string q, string[] nonHierarchyFields, int start = 0, int rows = 25, string type = "warranty")
        {
            var fields = warrantyHierachyRepository.GetAllLevels().Select(l => "Level_" + l.Id).Concat(nonHierarchyFields);

            return new Blue.Solr.Query()
                .SelectJsonWithJsonQuery(
                    q,
                    "Type:" + type,
                    facetFields: fields.ToArray(),
                    showEmpty: false,
                // the order that the fields appear on the search page are determined by the order of this array
                   start: start,
                   rows: rows
                   );
        }

        /// <summary>
        /// Only selects warranties that are not deleted - 'Deleted:No'...
        /// </summary>
        public string SearchSolrWarrantiesSelect(string q, int rows, bool filter)
        {
            var exFilter = filter ? " AND !WarrantyType:\"Instant Replacement\"" : "";
            return new Blue.Solr.Query()
                .SelectJson(
                    q,
                    "Type:warranty AND Deleted:No" + exFilter,
                    showEmpty: false,
                   start: 0,
                   rows: rows);
        }

        public string SearchSolr(string q, int start = 0, int rows = 25, string type = "warranty")
        {
            return SearchSolr(q, new[] { "Length", "Free", "Deleted" }, start, rows, type);
        }
    }
}