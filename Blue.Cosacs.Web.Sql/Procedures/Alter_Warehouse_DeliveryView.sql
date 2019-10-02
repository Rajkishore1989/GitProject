IF  EXISTS (SELECT * FROM sys.views WHERE object_id = OBJECT_ID(N'[Warehouse].[DeliveryView]'))
DROP VIEW [Warehouse].[DeliveryView]
GO

/****** Object:  View [Warehouse].[DeliveryView]    Script Date: 12/21/2018 5:53:24 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [Warehouse].[DeliveryView]
AS

SELECT 
      [Id]
      ,[CustomerName]
	    ,dbo.custaddress.DELTitleC + ' ' + dbo.custaddress.DELFirstName + ' ' + dbo.custaddress.DELLastName AS DName
      ,[AddressLine1]
      ,[AddressLine2]
      ,[AddressLine3]
      ,[PostCode]
      ,[StockBranch]
      ,[DeliveryBranch]
      ,[DeliveryOrCollection]
      ,[DeliveryOrCollectionDate]
      ,[ItemNo]
      ,[ItemId]
      ,[ItemUPC]
      ,[ProductDescription]
      ,[ProductBrand]
      ,[ProductModel]
      ,[ProductArea]
      ,[ProductCategory]
      ,[Quantity]
      ,[RepoItemId]
      ,[Comment]
      ,[DeliveryZone]
      ,[ContactInfo]
      ,[OrderedOn]
      ,[Damaged]
      ,[AssemblyReq]
      ,b.[AcctNo]
      ,[OriginalId]
      ,[TruckId]
      ,[PickingId]
      ,[PickingAssignedBy]
      ,[PickQuantity]
      ,[PickingComment]
      ,[PickingRejectedReason]
      ,[PickingRejected]
      ,[ScheduleId]
      ,[ScheduleComment]
      ,[ScheduleSequence]
      ,[PickingAssignedDate]
      ,[UnitPrice]
      ,[Path]
      ,[ScheduleRejected]
      ,[ScheduleRejectedReason]
      ,[DeliveryRejected]
      ,[DeliveryRejectedReason]
      ,[DeliveryConfirmedBy]
      ,[DeliveryRejectionNotes]
      ,[ScheduleQuantity]
      ,[DeliverQuantity]
      ,[Exception]
      ,[CurrentQuantity]
      ,[Express]
      ,[AddressNotes]
      ,[BookedBy]
      ,[Fascia]
      ,[PickUp]
      ,[PickUpDatePrinted]
      ,[PickUpNotePrintedBy]
      ,[DeliveryConfirmedDate]
      ,[CancelUser]
      ,[CancelDate]
      ,[CancelReason]
      ,[StockOnHand]
      ,[NonStockServiceType]
      ,[NonStockServiceItemNo]
      ,[NonStockServiceDescription]
      ,[DeliveryOrCollectionSlot]
      ,[StoreType]
      ,[ReceivingLocation], ISNULL(Ag.AgreementInvoiceNumber, Ag.Agrmtno) as OrderInvoiceNo
FROM Warehouse.BookingView b
		LEFT JOIN Agreement Ag on b.acctno = Ag.acctno
			inner join dbo.custacct AS custadd ON custadd.acctno = B.AcctNo LEFT OUTER JOIN
dbo.custaddress ON custadd.custid = dbo.custaddress.custid AND (dbo.custaddress.cusaddr1 = B.AddressLine1 OR
dbo.custaddress.cusaddr2 = B.AddressLine2)



GO



