if exists (select * from dbo.sysobjects where id = object_id('[Merchandising].[CreateHistoryForGRNandPO]') and OBJECTPROPERTY(id, 'IsProcedure') = 1)
	drop procedure [Merchandising].[CreateHistoryForGRNandPO]
GO
GO


Create PROCEDURE [Merchandising].[CreateHistoryForGRNandPO]	
@ProductId int
AS
BEGIN

INSERT INTO [Merchandising].[PurchaseOrderProductHistory]
					(Id,ProductId, Sku,Description, RequestedDeliveryDate, QuantityOrdered, 
					UnitCost, Comments,EstimatedDeliveryDate,PurchaseOrderId,PreLandedUnitCost, PreLandedExtendedCost ,LabelRequired,
					QuantityCancelled)

	Select			Id,ProductId, Sku,Description, RequestedDeliveryDate, QuantityOrdered, 
					UnitCost, Comments,EstimatedDeliveryDate,PurchaseOrderId,PreLandedUnitCost, PreLandedExtendedCost , LabelRequired,
					QuantityCancelled					 
					 from [Merchandising].[PurchaseOrderProduct] where ProductId =@ProductId 
					 -- select * from [Merchandising].[PurchaseOrderProduct]

	INSERT INTO [Merchandising].[PurchaseOrderHistory](Id,VendorId, Vendor,RequestedDeliveryDate, ReceivingLocationId, ReceivingLocation, 
					ReferenceNumbers, Currency,Comments,Status,OriginalPrint, CreatedDate ,CreatedById,CreatedBy, PaymentTerms, 
					OriginSystem, CorporatePoNumber,ShipDate,ShipVia,PortOfLoading,Attributes,CommissionChargeFlag,CommissionPercentage
					,ExpiredDate)

	Select			Id,VendorId, Vendor,RequestedDeliveryDate, ReceivingLocationId, ReceivingLocation, 
					ReferenceNumbers, Currency,Comments,Status,OriginalPrint, CreatedDate , CreatedById,CreatedBy, PaymentTerms,
					 OriginSystem, CorporatePoNumber,ShipDate,ShipVia,PortOfLoading,Attributes,CommissionChargeFlag,CommissionPercentage
					 ,ExpiredDate
					 from [Merchandising].[PurchaseOrder] where id in (select PurchaseOrderId from [Merchandising].[PurchaseOrderProductHistory] where ProductId =@ProductId )



INSERT INTO [Merchandising].[GoodsReceiptProductHistory](Id,GoodsReceiptId, PurchaseOrderProductId,QuantityReceived, QuantityBackOrdered, ReasonForCancellation, 
					QuantityCancelled, LastLandedCost)

	Select			Id,GoodsReceiptId, PurchaseOrderProductId,QuantityReceived, QuantityBackOrdered, ReasonForCancellation, 
					QuantityCancelled, LastLandedCost From [Merchandising].[GoodsReceiptProduct] 
					 where PurchaseOrderProductId in (select Id from [Merchandising].[PurchaseOrderProductHistory] where ProductId =@ProductId)


	INSERT INTO [Merchandising].[GoodsReceiptHistory](Id,LocationId, ReceivedById,VendorDeliveryNumber, VendorInvoiceNumber, DateReceived, 
					Comments, ReceivedBy,Location,OriginalPrint,DateApproved, ApprovedById, ApprovedBy, 
					CreatedDate ,CreatedById,CreatedBy, CostConfirmed, CostConfirmedById, CostConfirmedBy)

	Select			Id,LocationId, ReceivedById,VendorDeliveryNumber, VendorInvoiceNumber, DateReceived, 
					Comments, ReceivedBy,Location,OriginalPrint,DateApproved, ApprovedById, ApprovedBy,
					CreatedDate , CreatedById,CreatedBy, CostConfirmed, CostConfirmedById, CostConfirmedBy
	From GoodsReceipt where  id in (select GoodsReceiptId from [Merchandising].[GoodsReceiptProduct] where PurchaseOrderProductId in
	 (select Id from [Merchandising].[PurchaseOrderProduct] where ProductId =@ProductId))


	




END