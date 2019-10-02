using System.Linq;
using System.Web.Mvc;
using Domain = Blue.Cosacs.Warranty;
using Blue.Events;
using Blue.Cosacs.Warranty.Repositories;
using System.Collections.Generic;
using Blue.Glaucous.Client.Mvc;

namespace Blue.Cosacs.Web.Areas.Warranty.Controllers
{
    public class HierarchyController : Controller
    {
        private IEventStore audit;
        private WarrantyHierachyRepository repository;

        public HierarchyController(WarrantyHierachyRepository repository, IEventStore audit)
        {
            this.repository = repository;
            this.audit = audit;
        }

        [Permission(Domain.WarrantyPermissionEnum.HierarchyView)]
        [HttpGet]
        public ActionResult Index()
        {
            var hierarchyData = GetHierarchyData();
            return View("Index", model: hierarchyData.Data.ToJson());
        }

        public JsonResult GetHierarchyData()
        {
            var tags = repository.GetAllTags();
            var levels = repository.GetAllLevels();
            var tagsWithCounts = GetWarrantyCounts(levels, tags);
            return Json(new { Levels = levels, Tags = tagsWithCounts });
        }

        private IEnumerable<Models.Tag> GetWarrantyCounts(IEnumerable<Domain.Model.WarrantyLevel> levels, IEnumerable<Domain.Model.WarrantyTag> tags)
        {
            var solrResult = GetCountsFromSolr(levels);
            var viewTags = GetTagsWithCounts(tags, levels, solrResult);

            return viewTags;
        }

        private IEnumerable<Models.Tag> GetTagsWithCounts(IEnumerable<Domain.Model.WarrantyTag> tags, IEnumerable<Domain.Model.WarrantyLevel> levels, Solr.Result solrResult)
        {
            var viewTags = GetViewTags(tags);

            foreach (var facetField in solrResult.Facets.Fields)
            {
                var level = facetField.Key.Substring(facetField.Key.IndexOf("_") + 1);
                int levelId = 0;
                int.TryParse(level, out levelId);
                for (int i = 0; i < facetField.Value.Length; i += 2)
                {
                    var tagValue = facetField.Value[i] as string;
                    var tagCount = (long)facetField.Value[i + 1];
                    var tag = viewTags.Where(t => t.Name == tagValue && t.Level.Id == levelId).FirstOrDefault();
                    if (tag != null)
                    {
                        tag.WarrantyCount = tagCount;
                    }
                    else if (tagValue == "")
                    {
                        var domainLevel = levels.Where(l => l.Id == levelId).FirstOrDefault();
                        if (domainLevel != null)
                        {
                            viewTags.Add(new Models.Tag { Name = tagValue, WarrantyCount = tagCount, Level = new Models.Level(domainLevel) });
                        }
                    }
                }
            }

            return viewTags;
        }

        private static Solr.Result GetCountsFromSolr(IEnumerable<Domain.Model.WarrantyLevel> levels)
        {
            var levelFields = (from l in levels
                               select "Level_" + l.Id).ToArray();
            var solrResult = new Blue.Solr.Query().Select("*", "Type:Warranty", 0, 0, false, levelFields);
            return solrResult;
        }

        private List<Models.Tag> GetViewTags(IEnumerable<Domain.Model.WarrantyTag> repositoryTags)
        {
            var viewTags = new List<Models.Tag>();
            foreach (var item in repositoryTags)
            {
                viewTags.Add(new Models.Tag(item));
            }

            return viewTags;
        }
    }
}
