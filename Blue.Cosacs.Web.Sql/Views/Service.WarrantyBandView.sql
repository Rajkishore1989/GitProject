IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[service].[WarrantyBandView]'))
DROP VIEW  service.WarrantyBandView
Go

CREATE VIEW service.WarrantyBandView
AS

select * from WarrantyBand 

