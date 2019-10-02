namespace Blue.Cosacs.Web.Areas.Merchandising.Models
{
    public class Level
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public Level()
        {
        }

        public Level(Blue.Cosacs.Merchandising.Models.Level level)
        {
            this.Id = level.Id;
            this.Name = level.Name;
        }

        public Level(Blue.Cosacs.Merchandising.HierarchyLevel level)
        {
            this.Id = level.Id;
            this.Name = level.Name;
        }
    }
}