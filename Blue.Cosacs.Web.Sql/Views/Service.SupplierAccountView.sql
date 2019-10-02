IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Service].[SupplierAccountView]'))
DROP VIEW  Service.SupplierAccountView
Go

-- View not used any more