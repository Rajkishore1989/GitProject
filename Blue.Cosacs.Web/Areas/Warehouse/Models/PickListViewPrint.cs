using System.Collections.Generic;
using System.Linq;
using Blue.Cosacs.Warehouse;
using Blue.Cosacs.Web.Common;

namespace Blue.Cosacs.Web.Areas.Warehouse.Models
{
    public class PickListViewPrint
    {
        public PickListViewPrint()
            : this(null)
        {
        }

        private readonly StructureMap.IContainer container;

        public PickListViewPrint(List<PickListView> pickListView)
        {
            this.PickListView = pickListView;
            this.container = StructureMap.ObjectFactory.Container;
        }

        public List<PickListView> PickListView
        {
            get;
            set;
        }


        public List<PickListRow> RejectionCodes
        {
            get
            {
                var pickRejectId = "Blue.Cosacs.Warehouse.PICKREJECT";
                var provider = container.GetAllInstances<IPickListProvider>().Where(e => e.Id == pickRejectId).Single();
                var providerValues = provider.Load().Select(e => new PickListRow(e.k, e.v));
                return providerValues.ToList();
            }
        }
    }
}