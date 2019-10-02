-- ================================================
-- Project      : Blue.CoSACS.Web
-- File Name    : Warehouse.TruckView.sql
-- File Type    : MSSQL Server Stored Procedure Script
-- Title        : View of Warehouse.Truck
-- Author       : Ilyas Parker
-- Date         : 24/07/12
--
-- Change Control
-- --------------
-- Date      By  Description
-- ----      --  -----------
-- ================================================

IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[TruckView]'))
DROP VIEW [Warehouse].TruckView
GO

CREATE VIEW [Warehouse].[TruckView]
AS
	SELECT T.Id, T.Name, T.Branch, cast(T.Branch as varchar(4)) + ' ' + b.BranchName as BranchName, T.DriverId, D.Name as Driver, T.Size   
	FROM Warehouse.Truck T INNER JOIN Warehouse.Driver D ON  D.Id = T.DriverId
	INNER JOIN Branch B ON T.Branch = B.BranchNo
 
GO

