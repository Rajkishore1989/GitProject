namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class Tag
    {
        public int Id { get; set; }
        public Level Level { get; set; }
        public string Name { get; set; }
        public long WarrantyCount { get; set; }

        public Tag()
        {
        }

        public Tag(Blue.Cosacs.Merchandising.Models.Tag tag)
        {
            this.Id = tag.Id;
            this.Name = tag.Name;
            this.Level = new Level(tag.Level);
        }

        public Tag(Blue.Cosacs.Merchandising.HierarchyTag tag)
        {
            this.Id = tag.Id;
            this.Name = tag.Name;
            this.Level = new Level { Id = tag.LevelId };
        }
    }
}