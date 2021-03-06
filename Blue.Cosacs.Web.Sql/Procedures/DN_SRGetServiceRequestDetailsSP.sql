-- ================================================
-- Project      : CoSACS .NET
-- File Name    : DN_SRGetServiceRequestDetailsSP.sql
-- File Type    : MSSQL Server Stored Procedure Script
-- Title        : Get Single Service Request 
-- Author       : Shital P
-- Date         : 11-Nov-2018
--
-- This procedure will retrieve the Searches for a service request. Created for CR ZEN/UNC/CRF/CR2018-009

-- ================================================


IF OBJECT_ID('DN_SRGetServiceRequestDetailsSP') IS NOT NULL
	DROP PROCEDURE dbo.DN_SRGetServiceRequestDetailsSP
GO

create PROCEDURE [dbo].[DN_SRGetServiceRequestDetailsSP]

	@acctno	Varchar(30),
	@itemno	varchar(30)

AS    
	SET NOCOUNT ON
   

            Select * from [Service].[Request] where Account=@acctno and ItemNumber=@itemno
        

	SET NOCOUNT OFF
	
