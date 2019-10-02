IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Merchandising].[GoodsReceiptDirectProductView]'))
DROP VIEW  [Merchandising].[GoodsReceiptDirectProductView]
GO

create view [Merchandising].[GoodsReceiptDirectProductView] as
select
	grdp.*,
	grd.CreatedDate,
	grd.LocationId	
from
	Merchandising.GoodsReceiptDirectProduct grdp
	join Merchandising.GoodsReceiptDirect grd
	on grdp.GoodsReceiptDirectId = grd.Id