IF OBJECT_ID('Merchandising.SP_MERCHANDISE_INPUT') IS NOT NULL
	DROP PROCEDURE Merchandising.SP_MERCHANDISE_INPUT
GO 

CREATE PROCEDURE [Merchandising].[SP_MERCHANDISE_INPUT]		
		@InterfaceCode varchar(3),
		@XML varchar(max)
AS
BEGIN
	DECLARE @QueueName varchar(50)

SET @QueueName =
				CASE @InterfaceCode
					WHEN 'VDR' THEN 'Merchandising.Vendors'
					WHEN 'ITM' THEN 'Merchandising.Products'
					WHEN 'PO' THEN 'Merchandising.PurchaseOrder'
				END

IF (@QueueName IS NULL OR LEN(@QueueName) <= 0) 
	RAISERROR ('Invalid interface code', 18, 1) 
ELSE 
	INSERT INTO Hub.[Message] (CreatedOn, Body, Routing)
	VALUES (GETUTCDATE(), @Xml, @QueueName)

END
GO