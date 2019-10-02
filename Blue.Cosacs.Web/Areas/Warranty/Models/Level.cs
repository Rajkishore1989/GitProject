
namespace Blue.Cosacs.Web.Areas.Warranty.Models
{
    public class Level
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public Level()
        {
        }

        public Level(Blue.Cosacs.Warranty.Model.WarrantyLevel level)
        {
            this.Id = level.Id;
            this.Name = level.Name;
        }

        public Level(Blue.Cosacs.Warranty.Level level)
        {
            this.Id = level.Id;
            this.Name = level.Name;
        }
    }
}