-- ================================================
-- Project      : CoSACS .NET
-- File Name    : SRUpdateServiceRequest.sql
-- File Type    : MSSQL Server Stored Procedure Script
-- Title        : Get Single Service Request 
-- Author       : Shital P
-- Date         : 11-Nov-2018
--
-- This procedure will Update a service request. Created for CR ZEN/UNC/CRF/CR2018-009

-- ================================================

IF OBJECT_ID('SRUpdateServiceRequest') IS NOT NULL
	DROP PROCEDURE dbo.SRUpdateServiceRequest
GO


Create PROCEDURE [dbo].[SRUpdateServiceRequest]
@id int,
@userid int,
@Status Nvarchar (30),
@DeliveryDate nvarchar(30)
AS

BEGIN
	
	  IF(@DeliveryDate='')
	  BEGIN
	    If(@status='C')
		    SET @status='Closed'
			UPDATE [Service].[Request]
			SET [State]=@status , LastUpdatedUser=@userid, LastUpdatedOn=getdate(), IsClosed=1
			where id=@id
	  END
	  ELSE
	  BEGIN
			Update [Service].TechnicianBooking set [Date]= Cast(@DeliveryDate as Datetime) where RequestId=@id
	  END
END
